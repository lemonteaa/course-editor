import logo from './logo.svg';
import './App.css';

import { useState } from 'react';

import { useDisclosure } from '@chakra-ui/react'

import * as BrowserFS from 'browserfs';

import { ChakraProvider } from '@chakra-ui/react'
import { Text, Input, Button } from '@chakra-ui/react'

import MDEditor from '@uiw/react-md-editor';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

import ReactTreeView from "@cels/react-treeview";
import "@cels/react-treeview/dist/styles.css";

import { IconButton, CloseButton } from '@chakra-ui/react'

import { Flex, Box, VStack } from '@chakra-ui/react'

import { create } from "ipfs-http-client";

import { VscNewFile, VscNewFolder } from 'react-icons/vsc'
import { BiRename } from 'react-icons/bi'
import { RiDeleteBin6Line }from 'react-icons/ri'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'

import { JsonEditor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';

import { flattenDeep } from "lodash";

function ModalComp(props) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const myConfirm = async () => {
    await props.onConfirm();
    onClose();
  }
  return (
    <>
      <IconButton
        variant='outline'
        colorScheme='teal'
        icon={props.icon}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{props.modalTitle}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {props.mybody}
            </ModalBody>

            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={myConfirm}>
                Confirm
              </Button>
              <Button variant='ghost' onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
  )
}


function GetNearestParentFolder(path) {
  let t = path.split("/")
  t.pop()
  let res = t.join("/")
  return (res == "") ? "/" : res;
}

var bfs = {};
BrowserFS.install(bfs);
BrowserFS.configure({
  fs: "LocalStorage"
}, function (e) {
  if (e) {
    // An error happened!
    throw e;
  }
  // Otherwise, BrowserFS is ready-to-use!
  console.log("FS Ready");
})

function App() {
  const [cid, setCID] = useState("");

  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("**Hello world!!!**");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => setFileName(event.target.value)

  const [projTree, setProjTree] = useState();

  const [editingFiles, setEditingFiles] = useState([]);

  const [selectedNode, setSelectedNode] = useState();
  const [isLeafNode, setIsLeafNode] = useState(false);

  const [newFileFolder, setNewFileFolder] = useState("");
  const handleNewFileChange = (event) => setNewFileFolder(event.target.value)

  const newFile = () => {
    const mypath = isLeafNode ? GetNearestParentFolder(selectedNode) : selectedNode;
    let fs = bfs.require('fs');

    let filler = (mypath == "/") ? "" : "/";

    fs.writeFile(mypath + filler + newFileFolder, "", () => {
      console.log("File created at: " + mypath + filler + newFileFolder);

      const s = loadProject("/");
      console.log(s)
      setProjTree(s);
    })
  }
  const newFolder = () => {
    const mypath = isLeafNode ? GetNearestParentFolder(selectedNode) : selectedNode;
    let fs = bfs.require('fs');

    let filler = (mypath == "/") ? "" : "/";

    fs.mkdir(mypath + filler + newFileFolder, () => {
      console.log("Folder created at: " + mypath + filler + newFileFolder);

      const s = loadProject("/");
      console.log(s)
      setProjTree(s);
    })
  }

  const myLast = (arr) => {
    let n = arr.length
    return arr[n-1]
  }

  const loadProject = (rootPath) => {
    let fs = bfs.require('fs');

    const readDirRecursive = (rootPath) => {
      const endInSlash = (rootPath.slice(-1) == "/");
      const filler = endInSlash ? "" : "/";
      var result = [];
      try {
        let entries = fs.readdirSync(rootPath);
        console.log(entries);
        entries.forEach((val) => {
          result.push(readDirRecursive(rootPath + filler + val));
        })
      } catch (err) {
        if (err.errno == 20) {
          return { type: "file", value: rootPath, label: myLast(rootPath.split("/")), leaf: true };
        } else {
          console.log(err);
        }
      }

      return {
        type: "folder",
        value: rootPath,
        label: (rootPath == "/") ? "/" : myLast(rootPath.split("/")),
        children: result
      };
    }

    return readDirRecursive(rootPath);
  }






  const mytest = () => {
    let fs = bfs.require('fs');
    fs.mkdir("/welcome", (err) => {
      console.log("welcome");

      const s = loadProject("/");
      console.log(s)
      setProjTree(s);
    })
  }

  const handleNodeClick = (nodeId, nodeVal, isLeafNode) => {
    setSelectedNode(nodeVal);
    setIsLeafNode(isLeafNode);

    if (isLeafNode) {
      let tab = editingFiles.findIndex((f) => {
        return (f.path == nodeVal)
      })

      if (tab == -1) {
        let fs = bfs.require('fs');
        let filecontent = fs.readFileSync(nodeVal)
        let curTabCount = editingFiles.length

        let isJson = (nodeVal.substring(nodeVal.length - 4) == "json");

        setEditingFiles(cur => [...cur, { path: nodeVal, label: myLast(nodeVal.split("/")), content: filecontent.toString(), modified: false, isJson: isJson }])
        setTabIndex(curTabCount + 1)
        /*, (err, content) => {
          console.log("Read FIle CB")
          setFileContent(content.toString())
        })*/
      } else {
        setTabIndex(tab+1);
      }
    }
  }

  const [tabIndex, setTabIndex] = useState(0)

  const handleTabsChange = (index) => {
    setTabIndex(index)
  }

  const mdEditorUpdate = (c) => {
    let tab = tabIndex - 1;
    const data = editingFiles.slice();
    data[tab] = {
      ...data[tab],
      content: c,
      modified: true
    }

    setEditingFiles(data)
  }

  const saveOne = () => {
    let curFile = editingFiles[tabIndex - 1];
    if (curFile.modified) {
      let fs = bfs.require('fs');
      fs.writeFile(curFile.path, curFile.content, function (e) {
        console.log("Saved file?")
        console.log(e)

        const data = editingFiles.slice();
        data[tabIndex - 1] = {
          ...data[tabIndex - 1],
          modified: false
        }

        setEditingFiles(data)
      })
    }
  }

  const deleteFile = () => {
    console.log(selectedNode);
    let fs = bfs.require('fs');

    fs.rmdir(selectedNode, (err) => {
      console.log("delete cb")
      console.log(err)
    });
  };

  const walkProject = (proj) => {
    let fs = bfs.require('fs');
    if (proj.type == "file") {
      const content = fs.readFileSync(proj.value);
      return [{ path: proj.value, content: content }];
    } else {
      return flattenDeep(proj.children.map(walkProject));
    }
  }

  const debugwalk = () => {
    console.log(walkProject(projTree));
  }

  const publish = async () => {
    const client = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https"
    });

    const files = [{
      path: '/tmp/myfile.txt',
      content: 'ABC'
    }];
    
    var results = await client.addAll(walkProject(projTree));
    var collectedResults = [];
    for await (let res of results) {
      collectedResults.push(res);
      console.log(res);
    }
    let mycid = collectedResults[collectedResults.length - 1].cid;
    console.log(mycid);
    //console.log(mycid.toBaseEncodedString());
    console.log(mycid.toString());
    setCID(mycid.toString());
  }

  return (
    <div className="App">
      <ChakraProvider>
        <Text>Course Editor</Text>
        <Flex>
          <Box>
            <VStack>
              <Box>
                <ModalComp onConfirm={newFile} modalTitle="Create New File"
                  mybody={
                  <Box>
                    <Text>Create a new file under {isLeafNode ? GetNearestParentFolder(selectedNode) : selectedNode }:</Text>
                    <Input value={newFileFolder} onChange={handleNewFileChange} />
                  </Box>} 
                  icon={<VscNewFile />} />
                  <ModalComp onConfirm={newFolder} modalTitle="Create New Folder"
                  mybody={
                  <Box>
                    <Text>Create a new folder under {isLeafNode ? GetNearestParentFolder(selectedNode) : selectedNode }:</Text>
                    <Input value={newFileFolder} onChange={handleNewFileChange} />
                  </Box>} 
                  icon={<VscNewFolder />} />
                <IconButton
                  variant='outline'
                  colorScheme='teal'
                  icon={<BiRename />}
                />
                <ModalComp onConfirm={deleteFile} modalTitle="Confirm Deleting File/Folder"
                  mybody={<Text>You are about to delete the {isLeafNode ? "file" : "folder"} {selectedNode}. Proceed?</Text>} 
                  icon={<RiDeleteBin6Line />} />
              </Box>
              <ReactTreeView 
                data={projTree} 
                onNodeClick={handleNodeClick} />
            </VStack>
          </Box>
          <Box flex='1'>
            <Button onClick={saveOne}>Save</Button>
          <Tabs index={tabIndex} onChange={handleTabsChange}>
            <TabList>
              <Tab>Intro</Tab>
              {editingFiles.map((f) => {
                if (f.modified) {
                  return (
                    <Tab><Text as='i'>{f.label} *</Text><CloseButton size='sm'/></Tab>
                  )
                } else {
                  return (
                    <Tab>{f.label}<CloseButton size='sm'/></Tab>
                  )
                }
              })}
            </TabList>
            <TabPanels>
              <TabPanel>
                Introduction
              </TabPanel>
              {editingFiles.map((f) => {
                if (f.isJson) {
                  return (
                    <JsonEditor
                        value={f.content}
                        onChange={mdEditorUpdate}
                    />
                  )
                } else {
                  return (
                    <TabPanel>
                      <MDEditor
                        value={f.content}
                        onChange={mdEditorUpdate}
                      />
                    </TabPanel>
                  )
                }
              })}
            </TabPanels>
          </Tabs>
          </Box>
          
        
        </Flex>
        <VStack>
          <Box>
        <Button onClick={mytest}>Test</Button>
        <Button onClick={publish}>Publish to IPFS</Button>
        <Button onClick={debugwalk}>Walk project</Button>
        {projTree ? JSON.stringify(projTree) : ""}</Box>
        <Box><Text as="h4">IPFS CID: </Text> {cid}</Box>
        </VStack>
      </ChakraProvider>
    </div>
  );
}

export default App;

/*
<Input 
          value={fileName}
          onChange={handleChange}
          placeholder='File Name' 
        /> <Button isLoading={loading} onClick={saveFile}>Save</Button>
        <Button onClick={readFile}>Read File (Test)</Button>
        <Button onClick={readDir}>Read Dir</Button>
        <Button onClick={createDir}>Create Dir</Button>
        <Button onClick={getStat}>Get Stat</Button>
*/
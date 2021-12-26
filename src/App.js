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


const  dummyData  = {
  label:  'root',
  value:  "root/",
  children: [
      {
          label:  'parent',
          value:  "root/parent/",
          children: [
              { label:  'child1', value:"root/parent/child1", leaf:true },
              { label:  'child2', value:"root/parent/child2", leaf:true }
          ]
      },
      {
          label:  'parent2',
          value:"root/parent2/"
      }
  ]
};

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
    })
  }
  const newFolder = () => {
    const mypath = isLeafNode ? GetNearestParentFolder(selectedNode) : selectedNode;
    let fs = bfs.require('fs');

    let filler = (mypath == "/") ? "" : "/";

    fs.mkdir(mypath + filler + newFileFolder, () => {
      console.log("Folder created at: " + mypath + filler + newFileFolder);
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

  const saveFile = () => {
    setLoading(true);
    let fs = bfs.require('fs');
    fs.writeFile(fileName, fileContent, function (e) {
      //TODO
      console.log("Write FIle CB")
      console.log(e);
      setLoading(false);
    })
  }

  const createDir = () => {
    let fs = bfs.require('fs');
    fs.mkdir(fileName, (err) => {
      //TODO
      console.log("Create Dir CB")
      console.log(err)
    })
  }

  const readFile = () => {
    let fs = bfs.require('fs');
    fs.readFile(fileName, (err, content) => {
      //TODO
      console.log("Read FIle CB")
      console.log(content.toString())
    })
  }

  const readDir = () => {
    let fs = bfs.require('fs');
    fs.readdir(fileName, (err, files) => {
      //TODO
      console.log("Read Dir CB")
      console.log(err)
      if (err) {
        console.log(err.errno)
      }
      console.log(files)
    })
  }

  const getStat = () => {
    let fs = bfs.require('fs');
    fs.stat(fileName, (x) => {
      //TODO
      console.log("getStat CB")
      console.log(x)
    })
  }

  const mytest = () => {
    const s = loadProject("/");
    console.log(s)
    setProjTree(s)
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

        setEditingFiles(cur => [...cur, { path: nodeVal, label: myLast(nodeVal.split("/")), content: filecontent.toString(), modified: false }])
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
      return proj.children.map(walkProject).flatten();
    }
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
    
    var res = await client.addAll(walkProject(projTree));
    console.log(res);
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
                return (
                  <TabPanel>
                    <MDEditor
                      value={f.content}
                      onChange={mdEditorUpdate}
                    />
                  </TabPanel>
                )
              })}
            </TabPanels>
          </Tabs>
          </Box>
          
        
        </Flex>
        <Button onClick={mytest}>Test</Button>
        <Button onClick={publish}>Publish to IPFS</Button>
        {projTree ? JSON.stringify(projTree) : ""}
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
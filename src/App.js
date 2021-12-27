import logo from './logo.svg';
import './App.css';

import { useState, useRef } from 'react';

import { useDisclosure } from '@chakra-ui/react'

import * as BrowserFS from 'browserfs';

import { ChakraProvider } from '@chakra-ui/react'
import { Text, Input, Button, FormLabel } from '@chakra-ui/react'

import MDEditor from '@uiw/react-md-editor';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

import ReactTreeView from "@cels/react-treeview";
import "@cels/react-treeview/dist/styles.css";

import { IconButton, CloseButton } from '@chakra-ui/react'

import { Flex, Box, VStack } from '@chakra-ui/react'

import { Divider } from '@chakra-ui/react'

import {
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
} from '@chakra-ui/react'

import { create } from "ipfs-http-client";

import { VscNewFile, VscNewFolder } from 'react-icons/vsc'
import { BiRename } from 'react-icons/bi'
import { RiDeleteBin6Line }from 'react-icons/ri'
import { MdUpdate, MdCheckCircle, MdSchedule } from 'react-icons/md'

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

import { Client, PrivateKey } from '@hiveio/dhive';
let opts = {
  addressPrefix: 'TST',
  chainId:
      '18dcf0a285365fc58b71f18b3d3fec954aa0c141c44e4e5cb4cf777b9eab274e',
};
//connect to server which is connected to the network/testnet
const dhive_client = new Client("http://127.0.0.1:8090", opts);

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

function FullPublish(props) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [pubStep, setPubStep] = useState([{ finished: false, inprogress: false }, { finished: false, inprogress: false }]);

  const hiveName = useRef();
  const hivePostingKey = useRef();

  const [cid, setCID] = useState("");
  const [permalink, setPermalink] = useState("");

  const walkProject = (proj) => {
    let fs = bfs.require('fs');
    if (proj.type == "file") {
      const content = fs.readFileSync(proj.value);
      return [{ path: proj.value, content: content }];
    } else {
      return flattenDeep(proj.children.map(walkProject));
    }
  }

  const publishIPFS = async () => {
    const client = create({
      host: "ipfs.infura.io",
      port: 5001,
      protocol: "https"
    });

    const files = [{
      path: '/tmp/myfile.txt',
      content: 'ABC'
    }];
    
    var results = await client.addAll(walkProject(props.getProjTree()));
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

    return mycid.toString();
  }

  const publishHive = async (author, postingkey, manifest, coursecid) => {
    const privateKey = PrivateKey.fromString(postingkey);

    const taglist = ["course", "test"];

    const json_metadata = JSON.stringify({ 
        course_title: manifest["course_title"],
        ipfs_uri: coursecid,
        category: manifest["category"],
        difficulty: manifest["difficulty"],
        course_desc: manifest["course_desc"],
        course_obj: manifest["course_obj"],
        time_cost_est: manifest["time_cost_est"],
        unit_breakdown: manifest["unit_breakdown"],
        tags: taglist,
    });

    const payload = {
      author: author,
      body: "This is the official page for the course " + manifest["course_title"] + ", please respect the community rules. Thanks!",
      json_metadata: json_metadata,
      parent_author: '',
      parent_permlink: taglist[0],
      permlink: manifest["hive_permalink"],
      title: "Course Announcement (Official): " + manifest["course_title"],
    };
    console.log('client.broadcast.comment:', payload);
    let result = await dhive_client.broadcast.comment(payload, privateKey);
    console.log('response');
    console.log(result);

    //TODO: Set permalinks
    setPermalink("@" + author + "/" + manifest["hive_permalink"])
  }

  const fullpub = async () => {
    console.log(hiveName.current.value);
    console.log(hivePostingKey.current.value);
    const author = hiveName.current.value;
    const postingkey = hivePostingKey.current.value;

    //Get manifest
    let fs = bfs.require('fs');
    let manifest = JSON.parse(fs.readFileSync("/welcome/manifest.json").toString());
    console.log(manifest);
    console.log(manifest["course_title"]);

    //Generate permalink
    const mypermalink = manifest["course_title"].replace(/\s+/g, '-').toLowerCase().replace(/[^a-zA-Z0-9\-]/g, '') + '-' + 
    Math.random()
        .toString(36)
        .substring(2, 7);
    setPermalink("@" + author + "/" + mypermalink);
    
    //Modify manifest.json and submit to IPFS
    manifest["hive_permalink"] = mypermalink;
    manifest["hive_author"] = author;
    fs.writeFileSync("/welcome/manifest.json", JSON.stringify(manifest));

    const p = pubStep.slice();
    p[0] = {...p[0], inprogress: true };
    setPubStep(p);

    console.log(walkProject(props.getProjTree()))
    const mycid = await publishIPFS();

    const q = pubStep.slice();
    q[0] = {...q[0], inprogress: false, finished: true };
    q[1] = {...q[1], inprogress: true};
    setPubStep(q);

    //Submit post to Hive
    await publishHive(author, postingkey, manifest, mycid);

    const r = pubStep.slice();
    r[1] = {...r[1], inprogress: false, finished: true };
    setPubStep(r);
  }

  return (
    <>
      <Button onClick={onOpen}>Full publish</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Publish Course</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
            <Text>To publish the course, we will need to know your Hive posting credentials:</Text>
            <Box>
              <FormLabel htmlFor='username'>Name</FormLabel>
              <Input
                ref={hiveName}
                id='username'
                placeholder='Please enter user name'
              />
            </Box>
            <Box>
              <FormLabel htmlFor='postkey'>Posting Key</FormLabel>
              <Input
                ref={hivePostingKey}
                id='postkey'
                placeholder='Please enter Posting Key'
              />
            </Box>
            <Divider/>
            <Text>Publish Progress:</Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={(pubStep[0].finished) ? MdCheckCircle : (pubStep[0].inprogress ? MdUpdate : MdSchedule)} color='green.500' />
                Publish to IPFS {(pubStep[0].finished) ? ("...Done. (CID: " + cid + ")") : (pubStep[0].inprogress ? "..." : "")}
              </ListItem>
              <ListItem>
                <ListIcon as={(pubStep[1].finished) ? MdCheckCircle : (pubStep[1].inprogress ? MdUpdate : MdSchedule)} color='green.500' />
                Post to Hive Blockchain {(pubStep[1].finished) ? ("...Done. (Permalink: " + permalink + ")") : (pubStep[1].inprogress ? "..." : "")}
              </ListItem>
            </List>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={fullpub}>
              Publish!
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

  const getProjTree = () => {
    return projTree;
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
                /*if (f.isJson) {
                  return (
                    <JsonEditor
                        value={f.content}
                        onChange={mdEditorUpdate}
                    />
                  )
                } else {*/
                  return (
                    <TabPanel>
                      <MDEditor
                        value={f.content}
                        onChange={mdEditorUpdate}
                      />
                    </TabPanel>
                  )
                //}
              })}
            </TabPanels>
          </Tabs>
          </Box>
          
        
        </Flex>
        <VStack>
          <Box>
        <Button onClick={mytest}>Test</Button>
        
        <FullPublish getProjTree={getProjTree} />
        <Button onClick={debugwalk}>Walk project</Button>
        {projTree ? JSON.stringify(projTree) : ""}</Box>
        
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

        <Button onClick={publish}>Publish to IPFS</Button>
        <Box><Text as="h4">IPFS CID: </Text> {cid}</Box>
*/
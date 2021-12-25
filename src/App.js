import logo from './logo.svg';
import './App.css';

import { useState } from 'react';

import * as BrowserFS from 'browserfs';

import { ChakraProvider } from '@chakra-ui/react'
import { Text, Input, Button } from '@chakra-ui/react'

import MDEditor from '@uiw/react-md-editor';

import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

import ReactTreeView from "@cels/react-treeview";
import "@cels/react-treeview/dist/styles.css";

import { IconButton } from '@chakra-ui/react'

import { Flex, Box } from '@chakra-ui/react'


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
          result = rootPath;
        } else {
          console.log(err);
        }
      }

      return result;
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
    console.log(loadProject("/"))
  }

  return (
    <div className="App">
      <ChakraProvider>
        <Text>Course Editor</Text>
        <Flex>
          <Box>
            <ReactTreeView 
              data={dummyData} />
          </Box>
          <Box flex='1'>
            <MDEditor
              value={fileContent}
              onChange={setFileContent}
            />
          </Box>
          
        
        </Flex>
        <Button onClick={mytest}>Test</Button>
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
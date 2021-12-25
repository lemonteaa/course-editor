import logo from './logo.svg';
import './App.css';

import { useState } from 'react';

import * as BrowserFS from 'browserfs';

import { ChakraProvider } from '@chakra-ui/react'
import { Text, Input, Button } from '@chakra-ui/react'

import MDEditor from '@uiw/react-md-editor';

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

  const readFile = () => {
    let fs = bfs.require('fs');
    fs.readFile(fileName, (err, content) => {
      //TODO
      console.log("Read FIle CB")
      console.log(content.toString())
    })
  }
  return (
    <div className="App">
      <ChakraProvider>
        <Text>Course Editor</Text>
        <MDEditor
          value={fileContent}
          onChange={setFileContent}
        />
        <Input 
          value={fileName}
          onChange={handleChange}
          placeholder='File Name' 
        /> <Button isLoading={loading} onClick={saveFile}>Save</Button>
        <Button onClick={readFile}>Read File (Test)</Button>
      </ChakraProvider>
    </div>
  );
}

export default App;

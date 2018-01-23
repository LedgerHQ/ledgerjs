import React, { Component } from "react";
import "./App.css";

class App extends Component {
  render() {
    // HACK FOR NOW
    return (
      <iframe
        src="/docs"
        frameBorder="0"
        title="docs"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          border: "none",
          width: "100%",
          height: "100%"
        }}
      />
    );
  }
}

export default App;

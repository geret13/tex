const fs = require("fs");
const http = require('http');
const path = require('path');
const url = require('url');
const sharp = require('sharp');
const mjAPI = require("mathjax-node");
const port = process.env['PORT'] || 3000;


mjAPI.config({
  MathJax: {
    SVG: {
      scale: 500
    }
  }
});
mjAPI.start();

const requestHandler = (req, res) => {
  try {
    let request = url.parse(req.url, true);
    let action = decodeURIComponent(decodeURIComponent(request.pathname.substr(1)));

    if (action.endsWith("underscore-min.js")) {
      fs.readFile(path.join('node_modules/underscore/', action), 'utf8', function (err, contents) {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.end(contents);
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      return;
    }

    if (action.endsWith(".js")) {
      fs.readFile(path.join('node_modules/ace-builds/src-min/', action), 'utf8', function (err, contents) {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.end(contents);
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      return;
    }

    if (action === "") {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.readFile('index.html', 'utf8', function (err, contents) {
        res.end(contents);
      });
      return;
    }

    if (action === "favicon.ico") {
      res.end();
      return;
    }

    let dpi = "115";
    let input = action.match(/(.+)\/(.*)/);

    if (input) {
      dpi = input[1];
      action = input[2];
    }

    if (dpi === "check") {
      mjAPI.typeset({
        math: action,
        format: "TeX", // or "inline-TeX", "MathML"
        svg: true,     // or svg:true, or html:true
      }, function (data) {
        if (!data.errors) {
          res.end('[]');
        } else {
          res.end(JSON.stringify(data.errors));
        }
      });
      return;
    }

    mjAPI.typeset({
      math: action,
      format: "TeX", // or "inline-TeX", "MathML"
      svg: true,      // or svg:true, or html:true
    }, function (data) {
      if (!data.errors) {
        res.writeHead(200, { 'Content-Type': 'image/png' });

        let svg = data.svg.replace(/currentColor/g, 'white');

        sharp(Buffer.from(svg), {
          density: dpi
        })
          .png()
          .toBuffer()
          .then(function (data) {
            res.end(data);
          });
      } else {
        res.writeHead(400);
        res.end(JSON.stringify(data.errors));
      }
    });
  } catch (e) {
    res.writeHead(500);
    res.end(e.toString());
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
});

/*
 main test suite file load doms of index, about, and contact for testing
*/

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");

let index, about, contact, indexDom, aboutDom, contactDom;

try {
  index = fs.readFileSync("./index.html", "utf-8");
  about = fs.readFileSync("./about/index.html", "utf-8");
  contact = fs.readFileSync("./contact/index.html", "utf-8");
} catch (err) {
  console.error("could not find html files");
}

// preserves location info produced by the HTML parser
const options = {
  includeNodeLocations: true,
};

//only load if main index.html found else assign null for jest to test not null
indexDom = index ? new JSDOM(index, options) : null;
aboutDom = about ? new JSDOM(about, options) : null;
contactDom = contact ? new JSDOM(contact, options) : null;

module.exports = {
  doms: [indexDom, aboutDom, contactDom],
  INDEX: 0,
  ABOUT: 1,
  CONTACT: 2,
};

const sizeOf = require("image-size");
const fs = require("fs");
const { doms, INDEX, ABOUT, CONTACT } = require("./dom-check.js");

const docs = doms.map(dom => dom.window.document);

//load CSS file once
const css = fs.readFileSync("styles/main.css", "utf-8");

// since tests are expected to run synchronously, saving image info
const images = [];

describe("general HTML structure", () => {
  test("<head> should have a <title>", () =>
    docs.forEach(doc => expect(doc.querySelector("title")).not.toBeNull()));

  test("<head> should have a <meta> description element", () =>
    docs.forEach(doc =>
      expect(doc.querySelector("meta[name=description]")).not.toBeNull()
    ));

  test("all HTML files should contain an <h1>, and only one <h1>", () =>
    docs.forEach(doc => expect(doc.querySelectorAll("h1").length).toBe(1)));

  test("all HTML files should contain favicon information", () =>
    docs.forEach(doc =>
      expect(doc.querySelector("link[rel='shortcut icon']")).not.toBeNull()
    ));

  test("all index.html files must contain a <header>", () =>
    docs.forEach(doc => expect(doc.querySelector("header")).not.toBeNull()));

  test("all <header> elements must contain a <nav> element", () =>
    docs.forEach(doc =>
      expect(doc.querySelector("header>nav")).not.toBeNull()
    ));

  test("menu items in header <nav> must be in an <ul>", () =>
    docs.forEach(doc =>
      expect(doc.querySelector("header>nav>ul")).not.toBeNull()
    ));
});

describe("tests for main index.html", () => {
  test("main index.html must contain a <main>", () =>
    expect(docs[INDEX].querySelector("main")).not.toBeNull());

  test("<main> must contain two <article> elements", () => {
    const articles = docs[INDEX].querySelectorAll("article");
    expect(articles.length).toBeGreaterThanOrEqual(2);
  });

  test("each <article> must contain an <h2> and at least one <p>", () => {
    const articles = docs[INDEX].querySelectorAll("article");
    articles.forEach(article => {
      expect(article.querySelector("h2")).not.toBeNull();
      expect(article.querySelectorAll("p")).not.toBeNull();
    });
  });

  test("main index.html must contain an <aside>", () =>
    expect(docs[INDEX].querySelector("aside")).not.toBeNull());

  test("main index.html must contain a <footer>", () =>
    expect(docs[INDEX].querySelector("footer")).not.toBeNull());

  test("text in the <aside> must inside a <p>", () =>
    expect(docs[INDEX].querySelector("aside > p")).not.toBeNull());

  test("text in the <footer> must be inside a <p>", () =>
    expect(docs[INDEX].querySelector("footer > p")).not.toBeNull());
});

describe("image tests", () => {
  test("image paths are all lowercase and contain no spaces", () => {
    // builds the image array used by the other image tests
    let imgs = [];
    docs.forEach(doc => {
      imgs = imgs.concat(Array.from(doc.querySelectorAll("img")));
    });

    // no uppercase or whitespace
    const noUpper = new RegExp(/[A-Z]|\s/);
    const hero = new RegExp(/hero/);
    const svg = new RegExp(/svg$/);

    imgs.forEach(img => {
      const path = img.src.replace(/^..\//, "");
      const dimensions = sizeOf(path);

      images.push({
        img: img,
        dimensions: dimensions,
        path: path,
        checkDimensions: !hero.test(path) && !svg.test(path),
      });
      expect(noUpper.test(path)).toBe(false);
    });
  });

  // TODO: check <picture> source images
  test("images must be 1920px wide or less", () =>
    images.forEach(img =>
      expect(img.dimensions.width).toBeLessThanOrEqual(1920)
    ));

  test("relative paths to images used, and images must be in the images directory", () => {
    const regex = new RegExp(/^images\//);
    images.forEach(image => {
      expect(regex.test(image.path)).toBe(true);
    });
  });

  test("images that aren't SVGs and images outside <picture> elements have the <img> height and width attributes set to the src image's intrinsic dimensions", () => {
    images.forEach(image => {
      if (image.checkDimensions) {
        expect(image.img.width).toBe(image.dimensions.width);
        expect(image.img.height).toBe(image.dimensions.height);
      }
    });
  });

  test("main index.html contains a <picture> element", () =>
    expect(docs[INDEX].querySelector("picture")).not.toBeNull());

  test("<picture> element must contain three <source> elements with media and srcset attributes", () => {
    const sources = docs[INDEX].querySelectorAll("picture > source");
    expect(sources.length).toBeGreaterThanOrEqual(3);
    sources.forEach(source => {
      expect(source.getAttribute("media")).not.toBeNull();
      expect(source.getAttribute("srcset")).not.toBeNull();
    });
  });

  test("<picture> element must contain a fallback image", () =>
    expect(docs[INDEX].querySelector("picture > img")).not.toBeNull());

  //TODO: check srcset count
  test("about page includes an <img> element that uses srcset and sizes to load three versions of the same image with different widths", () => {
    const img = docs[ABOUT].querySelector("img");
    expect(img.getAttribute("srcset")).not.toBeNull();
    expect(img.getAttribute("sizes")).not.toBeNull();
  });

  test("contact page loads an SVG file with <img>", () =>
    expect(docs[CONTACT].querySelector("img[src$='.svg']")).not.toBeNull());
});
/*************/
/* new tests */
/*************/

describe("CSS tests", () => {
  test("normalize.css loaded as first stylesheet on all pages", () => {
    const regex = new RegExp(/normalize\..*css/);

    docs.forEach(doc => {
      const firstLink = doc.querySelector("link[rel='stylesheet']");
      expect(regex.test(firstLink.href)).toBe(true);
    });
  });

  test("stylesheet main.css in styles folder is loaded on all pages using relative links", () => {
    docs.forEach((doc, i) => {
      let found = false;

      doc.querySelectorAll("link[rel='stylesheet']").forEach(link => {
        if (i === INDEX) {
          if (link.href === "styles/main.css") {
            found = true;
          }
        } else {
          if (link.href === "../styles/main.css") {
            found = true;
          }
        }
      });

      expect(found).toBe(true);
    });
  });

  test("Google Fonts stylesheet is loaded on all pages after normalize.css but before main.css", () => {
    const regex = new RegExp(/fonts.googleapis.com/);
    let found = false;

    docs.forEach(doc => {
      doc.querySelectorAll("link[rel='stylesheet']").forEach((link, i) => {
        if (regex.test(link.href)) {
          if (i === 1) found = true;
        }
      });
    });
    expect(found).toBe(true);
  });

  test("global box-sizing rule set to border-box", () => {
    const regex = new RegExp(/\*\s+\{\s*\n\s+box-sizing:\s+border-box/);
    expect(regex.test(css)).toBe(true);
  });

  test(":root contains CSS variables for colors", () => {
    const regex = new RegExp(/:root\s+\{\s*\n\s+--/);
    expect(regex.test(css)).toBe(true);
  });

  test("font-family, color, and line-height set in body", () => {
    const attr = ["font-family", "color", "line-height"];
    let fail = false;

    attr.forEach(a => {
      const regexStr = `body\\s+{[^}]+${a}:`;
      const regex = new RegExp(regexStr);
      if (!regex.test(css)) {
        fail = true;
      }
    });

    expect(fail).toBe(false);
  });

  test("remove underlines from <a>", () => {
    const regex = new RegExp(/^a\s[^}]+text-decoration:\s+none/, "gm");
    expect(regex.test(css)).toBe(true);
  });

  test(":hover class for all <a> that contain href (non-dead links)", () => {
    const regex = new RegExp(/^a\[href\]:hover\s+{$/, "gm");
    expect(regex.test(css)).toBe(true);
  });

  test('two web buttons on main page: <a class="button">', () => {
    const buttons = docs[INDEX].querySelectorAll("a.button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test("CSS contains .button style declaration", () => {
    const regex = new RegExp(/\.button\s*\{.*/);
    expect(regex.test(css)).toBe(true);
  });

  test("CSS contains .button:hover style declaration", () => {
    const regex = new RegExp(/\.button:hover\s*\{.*/);
    expect(regex.test(css)).toBe(true);
  });
});

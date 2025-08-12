function decodeHTMLEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  function clean() {
    const fileInput = document.getElementById("ixbrlFile");
    const status = document.getElementById("status");

    if (!fileInput.files.length) {
      alert("Please select a file.");
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    // Force UTF-8 decoding
    reader.readAsText(file, 'UTF-8');

    reader.onload = function (e) {
      let content = e.target.result;

      // Check for XBRL/iXBRL content
      const isXBRL = (
        /<ix:header[\s\S]*?<\/ix:header>/gi.test(content) ||
        /<ix:[^>]+>/gi.test(content) ||
        /<\/ix:[^>]+>/gi.test(content) ||
        /\s+contextRef="[^"]*"/gi.test(content) ||
        /\s+ix:[a-zA-Z0-9\-]+="[^"]*"/gi.test(content) ||
        /<ix:[^>]+>\s*<\/ix:[^>]+>/gi.test(content)
      );

      if (!isXBRL) {
        alert("✅ This file is already clean (no iXBRL content found).");
        return;
      }

      // Basic iXBRL removal
      content = content
        .replace(/<\?xml[^>]*?>/gi, '')
        .replace(/<ix:header[\s\S]*?<\/ix:header>/gi, '')
        .replace(/<ix:[^>]+>/gi, '')
        .replace(/<\/ix:[^>]+>/gi, '')
        .replace(/\s+contextRef="[^"]*"/gi, '')
        .replace(/\s+ix:[a-zA-Z0-9\-]+="[^"]*"/gi, '')
        .replace(/<ix:[^>]+>\s*<\/ix:[^>]+>/gi, '')
        // .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!DOCTYPE[^>]*>/i, '<!DOCTYPE html>')
        .replace(/<html[^>]*?>/i, '<html>')
        .replace(/\s+xmlns(:\w+)?="[^"]*"/gi, '');
        

      // Lowercase tags (optional)
      content = content.replace(/<\/?[A-Z][^>\s]*\b/g, function (match) {
        return match.toLowerCase();
      });

      // DOM parsing to remove namespaced elements
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");

      doc.querySelectorAll('*').forEach(el => {
        if (el.tagName.includes(':')) el.remove();
        else {
          [...el.attributes].forEach(attr => {
            if (attr.name.includes(':') || attr.name.startsWith('xmlns')) {
              el.removeAttribute(attr.name);
            }
          });
        }
      });
      
      // Set <title> to match uploaded filename + _cleaned.html
      const titleTag = doc.querySelector("title");
      
      if (titleTag) {
        titleTag.textContent = file.name;
      } else {
        const head = doc.querySelector("head") || doc.createElement("head");
        const newTitle = document.createElement("title");
        newTitle.textContent = file.name;
        head.appendChild(newTitle);
        if (!doc.querySelector("head")) {
          doc.documentElement.insertBefore(head, doc.body);
        }
      }
      
    let cleanedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

    cleanedHTML = cleanedHTML
      .replace(/☐/g, '&#9744;')
      .replace(/☒/g, '&#9746;');

    cleanedHTML = cleanedHTML
      .replace(/’/g, '&rsquo;')
      .replace(/”/g, '&rdquo;')
      .replace(/“/g, '&ldquo;')
      .replace(/§/g, '&sect;')
      .replace(/–/g, '&ndash;')
      .replace(/—/g, '&mdash;')
      .replace(/●/g, '&#9679;')
      .replace(/\t/g, '&#9;')
      .replace(/†/g, '&#8224;')
      .replace(/<sup>\s*†\s*<\/sup>/gi, '<sup>&#8224;</sup>')
      .replace(/‡/g, '&#8225;').replace(/'/g, '&apos;')
      .replace(/−/g, '&#8722;');

      
      // Save final clean HTML
      const blob = new Blob([cleanedHTML], { type: "text/html" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = file.name;
      link.click();

      status.textContent = "✅ File cleaned and downloaded.";
      status.classList.add("show");
    };
  }

  const themeSwitch = document.getElementById('themeSwitch');

  themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark');
  });
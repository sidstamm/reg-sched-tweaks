/***************************
 * reg-sched tweaks
 *
 * load this into the schedule lookup (reg-sched.pl) site to make some
 * improvements.  A list of improvements:
 *
 *  > added functionality to ad-hoc group scheduling
 *     -- text entry box with buttons to "scroll to" or "add" maching entries.
 *     -- add a button to show/hide unselected names.
 *  > removed focus requirement to activate lookup buttons
 *     -- executed once, on load.  Will not persist.
 *  > added ability to press "enter" in search form to trigger username, room, or course lookup
 *  > added prev/next quarter navigation links when viewing all sections of a class in a given term
 *  > added "View All Sections" to options when viewing roster for one section of a course.
 *  > added "Roster View" button to course grid and "Schedule Grid View" to roster view to easily
 *     toggle back and forth
 *  > added support to show rosters and grid views for cross-listed classes
 *
 * @version 1.0.3 - 8/24/2026
 * @author Sid Stamm <stammsl@rose-hulman.edu>
 ***************************/

const TITLE = "TWEAKED";

const GROUP_SELECTION_INSTRUCTIONS = `
<div style="margin:5px;">
<span style='color:#00c; font-weight:bold;'>TWEAKED options:</span><br/>
<p>This version of the schedule lookup page supports a few new search/add features (CASE SENSITIVE):</p>
<ul>
<li><tt>add</tt> button: type something in the text box, then click "add" to select all matching items in the list.</li>
<li><tt>find</tt> button: type something in the text box, then click "find" to scroll to the first person matching entered text.</li>
<li><tt>toggle unselected</tt> button: toggle view of giant list to either show or hide unselected individuals.
</ul>
</div>
`;

const ARGOS_PHOTOS_URL = "https://reporter.rose-hulman.edu/mw/File.Get?Path=%5C%5Cbannershare%5CIDPhotos%5C"; // +id+".jpg";

const GET_PARAMS = new URLSearchParams(window.location.href);

// some helpers
let QS = (sel) => document.querySelector(sel);
let QSA = (sel) => document.querySelectorAll(sel);

/**
 * constructs a button with a map of attributes, a list of classes, and a click handler.
 * 
 * @param attr_map - OPTIONAL a dictionary of attributes to add to the button
 * @param class_list - OPTIONAL an array of classes to add to the button
 * @param onClickHandler - OPTIONAL an event handler to register with the button.
 * @returns an HTMLElement instance of the button.
 */
function buttonMaker(attr_map={}, class_list=['tweaked'], onClickHandler=null) {
  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  for (const k in attr_map) { btn.setAttribute(k, attr_map[k]); }
  for (const c of class_list) { btn.classList.add(c); }
  if (onClickHandler) {
    btn.addEventListener("click", onClickHandler);
  }
  return btn;
}

function prevQtr(qtrstr) {
  let yr = qtrstr.substr(0,4);
  let qtr = qtrstr.substr(4);
  qtr = parseInt(qtr) - 10;
  if (qtr < 10) { qtr = "40"; yr = parseInt(yr) - 1; }
  return `${yr}${qtr}`;
}
function nextQtr(qtrstr) {
  let yr = qtrstr.substr(0,4);
  let qtr = qtrstr.substr(4);
  qtr = parseInt(qtr) + 10;
  if (qtr > 40) { qtr = "10"; yr = parseInt(yr) + 1; }
  return `${yr}${qtr}`;
}

/**
 * Constructs a link element, which is optionally braced.
 * 
 * @param href - the hyperlink target
 * @param text - the text content (clickable part) of the link
 * @param braced - OPTIONAL whether or not to surround in non-clickable [ brackets ] (default = false)
 * @param classes - OPTIONAL a list of classes for the link element
 * @param attributes - OPTIONAL a dictionary of HTML attributes to add to the link
 * @returns an HTMLElement either the link element or a span containing the braces and link
 */
function makeLink(href, text, braced=true, classes=['tweaked'], attributes={}) {
    link = document.createElement("a");
    link.setAttribute("href", href);
    link.textContent = text;
    for (let c of classes) { link.classList.add(c); }
    for (let k in attributes) { link.setAttribute(k, attributes[k]); }
    if (!braced) { return link; }

    span = document.createElement("span");
    span.appendChild(document.createTextNode("["))
    span.appendChild(link);
    span.appendChild(document.createTextNode("]"))
    return span;
}


/**
 * Parses an HTML Dom table into an array of dictionaries, assuming the first
 * row is a header.
 * 
 * @param dom - the DOM of the table (use querySelector to find it)
 * @returns an array of key/value maps based on the text contents of the first row.
 */
function buildTableObject(dom) {
  let result = new Array();

  // parse the header
  let header = Array.from(dom.querySelector("tr").querySelectorAll("th")).map(n => n.textContent);

  let row = dom.querySelector("tr");
  while( (row = row.nextElementSibling) && row instanceof HTMLTableRowElement) {
    // generate an object and push into result.
    let entry = new Map()
    let elts = Array.from(row.querySelectorAll("td"));
    for(let i = 0; i < header.length; i++) {
      entry.set(header[i], elts[i].textContent);
    }
    result.push(entry);
  }
  return result;
}

/**
 * Determines if a class is crosslisted based on the available DOM and finds
 * what other class code is bound to this via cross-list.  
 * 
 * @param description - a string containin the description of the class.  Should
 *                      have "crosslisted w/" or similar if it is crosslisted.
 * @returns a string containing another class code (e.g., "CSSE490-02"), or null
 * if not crosslisted.  class is crosslisted with another.
 */
function crosslist(description) {
  // try to find the cross listed info in the course description.
  // it's not very consistent.
  let possibilities = ["cross-listed w/",
                       "cross-listed with",
                       "cross listed w/",
                       "cross listed with",
                       "crosslisted w/",
                       "crosslisted with"];
  try {
    description = description.toLowerCase();
    for(let pat of possibilities) {
      if (description.includes(pat)) {
        // after the "cross listed with" prefix, find all courses.
        // could be fragile if this is not the last part of the comments (e.g.,
        // "cross-listed w/ abc123-04 cannot be taken for credit with def456").
        // Not a common use case, and would require writing a new tokenizer or a
        // much more complicated regex.
        const coursere = RegExp(/[A-Z]+\s*[0-9]{3}L?(-[0-9]{1,2})?/, "ig");
        let matches = description.substr(description.indexOf(pat))
                                 .match(coursere);
        if(matches) {
          return matches.map(x => x.replace(" ", "").toUpperCase()).join("|");
        }
        break; //no sense in checking for another "cross list" annotation.
      }
    }
  } catch(e) {
    console.log(e);
  }
  // default: no matches.
  return null;
}


/**
 *  Checks if access to Argos (photos source) is responding and authenticated.
 *  This is a little hacky since it relies on a succeed/failure state of loading
 *  an image.  :(
 *  
 *  @returns a promise that resolves if it is available, and rejects if not.
 */
function canAccessArgos() {
  let e = document.createElement("img");
  e.style.visibility = "hidden";
  return new Promise((resolve, reject) => {
    // Attempt to load an image in a hidden way and catch errors.
    e.src = ARGOS_PHOTOS_URL + "800116326" + ".jpg";

    e.onload  = () => { document.body.removeChild(e); resolve('Argos available - can load images.'); }
    e.onerror = () => { document.body.removeChild(e); reject('Argos session not active.'); }

    document.body.appendChild(e);
  });
}

/**
 * Creates (and returns) an on/off callback for showing photos in a table.
 * This first checks if an Argos session is open so the images can be accessed.
 * If not, it will not try to load images.
 * 
 * @param {HTMLTableElement} tableElement  - the table where you want to add the photos
 * @param {int} bannerid_col  - the column of the table that contains the banner id number of the subjects.
 * @returns a callback
 */
function createLoadPhotosCallback(tableElement, bannerid_col) {
  return function() {
    canAccessArgos().then(
      // This is the "resolve" callback (images can be loaded).
      (m) => {
        //console.log(m);
        if(tableElement.hasAttribute("hasPhotos")) {
          // if they're loaded already, unload them.
          let participant_table_rows = tableElement.querySelectorAll("tbody > tr");
          for (let r of participant_table_rows) {
            let td = r.querySelector("td.photo");
            if (td) { r.removeChild(td); }
          }
          tableElement.removeAttribute("hasphotos");
        } else {
          // Load the photos
          tableElement.setAttribute("hasphotos", "true");
          let participant_table_rows = tableElement.querySelectorAll("tbody > tr");
          // skip header (that's why i starts at 1)
          for (let i = 1; i < participant_table_rows.length; i++) {
            let id = participant_table_rows[i].querySelector("td:nth-of-type(" + bannerid_col + ")").textContent;
            let e = document.createElement("img");
            e.src = ARGOS_PHOTOS_URL + id + ".jpg";
            e.setAttribute("width", "32px");
            let a = document.createElement("a");
            a.href=e.src + "&Content-Disposition=inline";
            a.setAttribute("target", "_blank");
            a.style = "border:0px;"
            a.appendChild(e);
            let td = document.createElement("td");
            td.classList.add("photo");
            td.appendChild(a);
            participant_table_rows[i].appendChild(td);
          }
        }
      },

      // This is the "reject" callback (images can NOT be loaded).
      (m) => {
        if(confirm("Can't load images.  Please log into ArgosWeb first.\n\n "
              + "NOTE: This requires you are on the VPN and currently "
              + "authenticated to ARGOS with current RHIT credentials.\n\n"
              + "Click OK to open Argos now (or cancel to skip it).")) {
                window.open("https://reporter.rose-hulman.edu/Argos/AWV/");
              }
        console.log(m);
      }
    );
  } 
}

/*************************************** GLOBALLY USEFUL VARS ********************************************** */
// find the "setlink" in case this was a post; can't rely on querystring.
// FORMAT: https://prodwebxe-hv.rose-hulman.edu/regweb-cgi/reg-sched.pl?type=Course&termcode=202510&view=tgrid&id=CSSE232
let setlink = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Download Calendar")[0];
if (!setlink) {
  setlink = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0];
}

/************************ AD-HOC GROUP SCHEDULES VIEW ******************************** */
/* Adds UI to select items in the "ad-hoc group schedule" thing.
 * Also adds show/hide unselected items.
 */
// fixes error that shows up in the console.
window.disableSubmitButton = function(x) { console.log("wrapped erroneous disable function.");}
if (QS("select#id6")) {
  let selx = QS("select#id6");

  // add some instructions
  document.querySelector("table.datadisplaytable > tbody > tr > td.bw80")
          .insertAdjacentHTML('beforeend', GROUP_SELECTION_INSTRUCTIONS);

  /** This is the original function, but content scripts cannot inject it.
  var sel = (nm) => {
  [...document.querySelector("#id6").querySelectorAll('option')]
       .filter(e => e['label'].includes(nm)).forEach(e => e.selected = true);
  }
  **/

  let div = document.createElement("div");

  // create text box for searching
  let txt = document.createElement("input");
  txt.setAttribute("type", "text");
  txt.setAttribute("id", "seltext");
  div.appendChild(txt);

  // create button for adding to the selected list
  btn = buttonMaker(
    {"name": "addbtn", "value":"add", "title":"Click to add all matching items"},
    ['tweaked'],
    (e) => {
       [...document.querySelector("#id6").querySelectorAll("option")]
       .filter(e => e['label'].includes(document.querySelector("#seltext").value))
       .forEach(e => {e.selected = true; e.scrollIntoView()})
    }
  );
  div.appendChild(btn);

  // also create button that will scroll to first match
  btn = buttonMaker(
    {"name": "findbtn", "value":"find", "title":"Click to scroll to first match"},
    ['tweaked'],
    (e) => {
       [...document.querySelector("#id6").querySelectorAll("option")]
       .filter(e => e['label'].includes(document.querySelector("#seltext").value))[0]
       .scrollIntoView()
    }
  );
  div.appendChild(btn);

  // Create a button for showing/hiding the unselected things.
  btn = buttonMaker(
    {"name": "togglebtn", "value":"toggle unselected", "showUnselected": "yes", "title":"Click to show/hide unselected items"},
    ['tweaked'],
    (ev) => {
        if (ev.target.hasAttribute("showUnselected")) {
          ev.target.removeAttribute("showUnselected");
          [...document.querySelector("#id6").querySelectorAll("option")]
            .forEach(e => { if(e.selected) { e.removeAttribute("hidden"); }
                            else { e.setAttribute("hidden", "true");} });
        } else {
          ev.target.setAttribute("showUnselected","yes");
          [...document.querySelector("#id6").querySelectorAll("option")]
            .forEach(e => { e.removeAttribute("hidden"); });
        }
    }
  );
  div.appendChild(btn);

  selx.parentNode.insertBefore(div, selx);
}


/************************ ROSTER VIEW ******************************** */
/* Tweaks for COURSE ID (ONE section or MULTIPLE sections, Roster View) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course ID: ")) {
  // get parameters from URL.  //usp = new URL(window.location.href).searchParams;
  // setlink is populated above.
  let seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Roster");
  let usp = seturl.searchParams;

  // find the "[Set Grid]" link; we will insert new links after it
  let target = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0].parentNode;

  // if the course is cross-listed, add the "crosslisted" link.  But only if
  // we're not already displaying multiple sections.
  if (!seturl.searchParams.get("id").includes("|")) {
    let courserows = QSA("body > p > table > tbody > tr");
    let db = buildTableObject(QS("body > p > table > tbody"));
    // Quick check for "Course" in header row to make sure that this is the right table.
    if(!db || db.length <= 0) {
      // nothing to do, there are no entries here (probably a "no result search")
    } else if(db[0].has("Course")) {
      let firstdesc = db[0].get("Comments");
      if (cl = crosslist(firstdesc)) {
        current_id = seturl.searchParams.get("id");
        crossid = current_id + "|" + cl;
        let newurl = new URL(seturl);
        newurl.searchParams.set("id", crossid)
        crossseclink = makeLink(newurl, "Show Crosslisted Sections");
        setlink.parentNode.appendChild(crossseclink);
      }
    } else {
      console.log("ERROR in reg-sched-tweaks: crosslist parsing is broken (table parsing).");
    }
  }

  // if the current lookup is not already all sections, add the "all sections" link
  if (usp.get("id").split("-").length > 1) {
    let newurl = new URL(seturl);
    newurl.searchParams.set("type","Roster");
    newurl.searchParams.set("id", usp.get("id").split("-")[0]);
    allseclink = makeLink(newurl, "View All Sections");
    target.appendChild(allseclink);
  }

  // add "Schedule Grid view" button (type=Course)
  let newurl = new URL(seturl);
  newurl.searchParams.set("type","Course");
  schedulelink = makeLink(newurl, "Schedule Grid View");
  target.appendChild(schedulelink);

  // create prev/next buttons
  newurl = new URL(seturl);
  newurl.searchParams.set("termcode", prevQtr(usp.get("termcode")));
  leftlink = makeLink(newurl, "<< Previous Quarter");
  newurl.searchParams.set("termcode", nextQtr(usp.get("termcode")));
  rightlink = makeLink(newurl, "Next Quarter >>");

  target.appendChild(leftlink);
  target.appendChild(rightlink);

  // add photo column to participants table
  let participant_table_rows = QSA("body > p:nth-of-type(2) > table > tbody > tr");
  let photo_header = document.createElement("th");
  photo_header.textContent = "📷";
  photo_header.title = "show photos";

  photo_header.onclick = createLoadPhotosCallback(QS("body > p:nth-of-type(2) > table"), 3);
  participant_table_rows[0].appendChild(photo_header);
}

/************************ ADVISOR ROSTER VIEW ******************************** */
// this is a variant of "User"
if(QS("tr > td.wr100") && QS("tr > td.wr100").textContent.startsWith("Advisor Roster - ")) {
  // add photo column to participants table
  let participant_table_rows = QSA("body > p:nth-of-type(2) > table > tbody > tr");
  let photo_header = document.createElement("th");
  photo_header.textContent = "📷";
  photo_header.title = "show photos";

  photo_header.onclick = createLoadPhotosCallback(QS("body > p:nth-of-type(2) > table"), 3);
  participant_table_rows[0].appendChild(photo_header);
}

/************************ COURSE VIEW ******************************** */
/* Tweaks for COURSE (all sections, Course Grid view) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course: ")) {

  // FORMAT: https://prodwebxe-hv.rose-hulman.edu/regweb-cgi/reg-sched.pl?type=Course&termcode=202510&view=tgrid&id=CSSE232
  // setlink is populated above.
  let seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Course");
  let usp = seturl.searchParams;

  // add "Roster view" button (type=Roster)
  newurl = new URL(seturl);
  newurl.searchParams.set("type","Roster");
  rosterlink = makeLink(newurl, "Roster View");

  // create prev/next buttons
  newurl = new URL(seturl);
  newurl.searchParams.set("termcode", prevQtr(usp.get("termcode")));
  leftlink = makeLink(newurl, "<< Previous Quarter");
  newurl.searchParams.set("termcode", nextQtr(usp.get("termcode")));
  rightlink = makeLink(newurl, "Next Quarter >>");

  // if the current lookup is not all sections, add the "all sections" link
  if (usp.get("id").split("-").length > 1) {
    newurl = new URL(seturl);
    newurl.searchParams.set("id", newurl.searchParams.get("id").split("-")[0]);
    allseclink = makeLink(newurl, "View All Sections");
    setlink.parentNode.appendChild(allseclink);
  }

  setlink.parentNode.appendChild(rosterlink);
  setlink.parentNode.appendChild(leftlink);
  setlink.parentNode.appendChild(rightlink);
}

/************************ USERNAME VIEW ******************************** */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Name: ")) {
  // setlink is populated above.
  let seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Username");
  let usp = seturl.searchParams;

  // create prev/next buttons
  // (but only if not an advisor roster, that's strange.)
  if(!QS("tr > td.wr100") || !QS("tr > td.wr100").textContent.startsWith("Advisor Roster")) {
    newurl = new URL(seturl);
    newurl.searchParams.set("termcode", prevQtr(usp.get("termcode")));
    leftlink = makeLink(newurl, "<< Previous Quarter");
    newurl.searchParams.set("termcode", nextQtr(usp.get("termcode")));
    rightlink = makeLink(newurl, "Next Quarter >>");

    setlink.parentNode.appendChild(leftlink);
    setlink.parentNode.appendChild(rightlink);
  }
}

/************************ MAIN PAGE ******************************** */
/* Tweaks for main page only */
if(QS("input[name=id1]")) {

  // Removes the initial focus requirement on the lookup buttons.
  // This way you don't have to click into "room" before clicking the room search
  // button (for example).
  for (let bt of ['bt4', 'bt5', 'bt1', 'deptbt']) {
    let x = QS(`input[name=${bt}`);
    if(x) { x.removeAttribute("disabled"); }
  }

  // Fix enter key for room and courseid lookup submission
  function fixEnter(id, btn) {
    QS("input[name="+id+"]").addEventListener("keyup",
        (ev) => { if (ev.key == "Enter") { QS("input[name="+btn+"]").click(); }});
  }
  if(QS("input[name=id1]")) { fixEnter("id1", "bt1"); }
  if(QS("input[name=lnameid]")) { fixEnter("lnameid", "lnamebt"); }
  if(QS("input[name=id4]")) { fixEnter("id4", "bt4"); }
  if(QS("input[name=id5]")) { fixEnter("id5", "bt5"); }


  // add "me" option (push to store your username, push to use it)
  mebtn = buttonMaker(
    {"name": "mebtn", "value":"me", "title":localStorage.getItem("regsched.Me")},
    ["tweaked"],
    (e) => {
      let v = localStorage.getItem("regsched.Me");
      if (v == null) {
        alert("Click the '+' button first.");
        return false;
      }
      QS("input[name=id1]").value = v;
      QS("input[name=bt1]").click();
    }
  );

  btn = buttonMaker(
    {"name": "meplusbtn", "value": "+", "title": "click to set a value that will be remembered when you visit this page"},
    ["tweaked"],
    (e) => {
      def = prompt("What is your rhit username?  This will be remembered for you.", localStorage.getItem("regsched.Me") || "");
      if (def) {
        localStorage.setItem("regsched.Me", def);
        QS("input[name=id1]").value = localStorage.getItem("regsched.Me");
      }
    }
  );
  QS("input[name=bt1]").insertAdjacentElement("afterend", btn);
  QS("input[name=bt1]").insertAdjacentElement("afterend", mebtn);

  // Sets the default focus to be the username (main search page only)
  QS("input[name=id1]").focus();
}

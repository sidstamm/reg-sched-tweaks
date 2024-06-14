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
 *
 * @version 1.0.1 - 5/30/2024
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


/************************ AD-HOC GROUP SCHEDULES VIEW ******************************** */
/* Adds UI to select items in the "ad-hoc group schedule" thing.
 * Also adds show/hide unselected items.
 */
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
/* Tweaks for COURSE ID (ONE section, Roster View) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course ID: ")) {
  // get parameters from URL.  //usp = new URL(window.location.href).searchParams;
  // steal this in case the request was a POST and not a GET
  let setlink = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0];
  seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Roster");
  usp = seturl.searchParams;

  // find the "[Set Grid]" link; we will insert new links after it
  let target = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0].parentNode;

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
}

/************************ COURSE VIEW ******************************** */
/* Tweaks for COURSE (all sections, Course Grid view) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course: ")) {

  // FORMAT: https://prodwebxe-hv.rose-hulman.edu/regweb-cgi/reg-sched.pl?type=Course&termcode=202510&view=tgrid&id=CSSE232
  // steal this in case the request was a POST and not a GET
  let setlink = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0];
  seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Course");
  usp = seturl.searchParams;

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
  // FORMAT: https://prodwebxe-hv.rose-hulman.edu/regweb-cgi/reg-sched.pl?type=Username&termcode=202510&view=tgrid&id=claassen
  // steal this in case the request was a POST and not a GET
  let setlink = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Download Calendar")[0];
  seturl = new URL(setlink['href']);
  seturl.searchParams.set("type", "Username");
  usp = seturl.searchParams;

  // create prev/next buttons
  newurl = new URL(seturl);
  newurl.searchParams.set("termcode", prevQtr(usp.get("termcode")));
  leftlink = makeLink(newurl, "<< Previous Quarter");
  newurl.searchParams.set("termcode", nextQtr(usp.get("termcode")));
  rightlink = makeLink(newurl, "Next Quarter >>");

  setlink.parentNode.appendChild(leftlink);
  setlink.parentNode.appendChild(rightlink);
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

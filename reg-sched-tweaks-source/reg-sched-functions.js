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

// some helpers
let QS = (sel) => document.querySelector(sel);
let QSA = (sel) => document.querySelectorAll(sel);

// constructs a button with a map of attributes, a list of classes, and a click handler.
function buttonMaker(attr_map, class_list, onClickHandler) {
  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  for (const k in attr_map) { btn.setAttribute(k, attr_map[k]); }
  for (const c of class_list) { btn.classList.add(c); }
  if (onClickHandler) {
    btn.addEventListener("click", onClickHandler);
  }
  return btn;
}

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
  let btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.value = "add";
  btn.setAttribute("onclick",
    `[...document.querySelector("#id6").querySelectorAll("option")]
         .filter(e => e['label'].includes(document.querySelector("#seltext").value))
         .forEach(e => {e.selected = true; e.scrollIntoView()});`
  );
  div.appendChild(btn);

  // also create button that will scroll to first match
  btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.value = "find";
  btn.setAttribute("onclick",
    `[...document.querySelector("#id6").querySelectorAll("option")]
         .filter(e => e['label'].includes(document.querySelector("#seltext").value))[0]
         .scrollIntoView();`
  );
  div.appendChild(btn);

  // Create a button for showing/hiding the unselected things.
  btn = document.createElement("input");
  btn.setAttribute("type", "button");
  btn.setAttribute("value", "toggle unselected");
  btn.setAttribute("showUnselected", "yes");
  btn.setAttribute("onclick",
    `if (this.hasAttribute("showUnselected")) {
         this.removeAttribute("showUnselected");
       [...document.querySelector("#id6").querySelectorAll("option")]
         .forEach(e => { if(e.selected) { e.removeAttribute("hidden"); }
                         else { e.setAttribute("hidden", "true");} });
     } else {
         this.setAttribute("showUnselected","yes");
       [...document.querySelector("#id6").querySelectorAll("option")]
         .forEach(e => { e.removeAttribute("hidden"); });
     }`
  );
  div.appendChild(btn);

  selx.parentNode.insertBefore(div, selx);
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

const GET_PARAMS = new URLSearchParams(window.location.href);

/************************ ROSTER VIEW ******************************** */
/* Tweaks for COURSE ID (ONE section, Roster View) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course ID: ")) {
  // get parameters from URL.
  usp = new URLSearchParams(window.location.href);

  // find the "[Set Grid]" link; we will insert new links after it
  let target = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0].parentNode;

  // if the current lookup is already all sections, don't add the "all sections" link
  if (usp.get("id").split("-").length > 1) {
    allseclink = document.createElement("a");
    allseclink.setAttribute("href", `?type=Roster&termcode=${usp.get("termcode")}&view=tgrid&id=${usp.get("id").split("-")[0]}`);
    allseclink.textContent = "View All Sections";
    allseclink.classList.add("tweaked");
    target.appendChild(document.createTextNode("["));
    target.appendChild(allseclink);
    target.appendChild(document.createTextNode("]"));
  }

  // add "Schedule Grid view" button (type=Course)
  schedulelink = document.createElement("a");
  schedulelink.setAttribute("href", `?type=Course&termcode=${usp.get("termcode")}&view=tgrid&id=${usp.get("id")}`);
  schedulelink.textContent = "Schedule Grid View";
  schedulelink.classList.add("tweaked");
  target.appendChild(document.createTextNode("["));
  target.appendChild(schedulelink);
  target.appendChild(document.createTextNode("]"));
}

/************************ ROSTER VIEW ******************************** */
/* Tweaks for COURSE (all sections, Course Grid view) lookup */
if(QS("tr > td.bw80") && QS("tr > td.bw80").textContent.startsWith("Course: ")) {

  // FORMAT: https://prodwebxe-hv.rose-hulman.edu/regweb-cgi/reg-sched.pl?type=Course&termcode=202510&view=tgrid&id=CSSE232
  setlink = QS("tbody > tr > td.bw70 > a")["href"];
  //console.log("Set link: " + setlink);
  // parse it
  usp = new URLSearchParams(setlink);

  // find the "[Set Grid]" link; we will insert new links after it
  let target = [...QSA("tbody > tr > td.bw70 > a")].filter((v) => v.textContent == "Set Grid")[0].parentNode;

  leftlink = document.createElement("a");
  leftlink.setAttribute("href", `?type=Course&termcode=${prevQtr(usp.get("termcode"))}&view=tgrid&id=${usp.get("id")}`);
  leftlink.textContent = "[ << Previous Quarter ]";
  leftlink.classList.add("tweaked");
  rightlink = document.createElement("a");
  rightlink.setAttribute("href", `?type=Course&termcode=${nextQtr(usp.get("termcode"))}&view=tgrid&id=${usp.get("id")}`);
  rightlink.textContent = "[ Next Quarter >> ]";
  rightlink.classList.add("tweaked");


  // add "Roster view" button (type=Roster)
  rosterlink = document.createElement("a");
  rosterlink.setAttribute("href", `?type=Roster&termcode=${usp.get("termcode")}&view=tgrid&id=${usp.get("id")}`);
  rosterlink.textContent = "[ Roster View ]";
  rosterlink.classList.add("tweaked");

  // if the current lookup is not all sections, add the "all sections" link
  if (usp.get("id").split("-").length > 1) {
    allseclink = document.createElement("a");
    allseclink.setAttribute("href", `?type=Course&termcode=${usp.get("termcode")}&view=tgrid&id=${usp.get("id").split("-")[0]}`);
    allseclink.textContent = "View All Sections";
    allseclink.classList.add("tweaked");
    target.appendChild(document.createTextNode("["));
    target.appendChild(allseclink);
    target.appendChild(document.createTextNode("]"));
  }

  //target.appendChild(document.createElement("br"));
  target.appendChild(rosterlink);
  target.appendChild(leftlink);
  target.appendChild(rightlink);
}

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

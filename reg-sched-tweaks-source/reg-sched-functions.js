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
 *  > added ability to press "enter" in search form to trigger room or course lookup
 *
 * @version 1.0 - 5/30/2023
 * @author Sid Stamm <stammsl@rose-hulman.edu>
 ***************************/

const TITLE = "TWEAKED";

// some helpers
let QS = (sel) => document.querySelector(sel);
let QSA = (sel) => document.querySelectorAll(sel);

/* Adds UI to select items in the "ad-hoc group schedule" thing.
 * Also adds show/hide unselected items.
 */
if (QS("select#id6")) {
  let selx = QS("select#id6");

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


/* Tweaks for main page only */
if(QS("input[name=id1]")) {

  // Sets the default focus to be the username (main search page only)
  QS("input[name=id1]").focus();

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
  if(QS("input[name=id4]")) { fixEnter("id4", "bt4"); }
  if(QS("input[name=id5]")) { fixEnter("id5", "bt5"); }
}



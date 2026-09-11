# -*- coding: utf-8 -*-
import time, os
from pathlib import Path

os.makedirs("/home/ubuntu/androidscroll/shots", exist_ok=True)
report = []
def log(m): report.append(str(m))
def take(name):
    try:
        p = capture_screenshot()
        log("SHOT:" + name + "=" + str(p))
    except Exception as e:
        log("SCREENSHOT_FAIL:" + name + ":" + str(e)[:160])

ensure_real_tab()
new_tab("file:///home/ubuntu/androidscroll/build/dist/index.html")
wait_for_load()
time.sleep(1.4)

idx = js("(function(){var el=document.getElementById('search-index');return el?el.textContent.length:0;})()")
log("search_index_length:" + str(idx))
if not idx:
    log("stop: no search-index")
    print("\n".join(report)); os._exit(1)
log("page_loaded")

# 1) open overlay + verify focus
try:
    js("(function(){var t=document.getElementById('search-trigger');t&&t.click();})()")
except Exception as e:
    log("open_fail:" + str(e)[:160])
time.sleep(0.6)
ae = js("(function(){var ae=document.activeElement;return ae?ae.id:'';})()")
log("after-open activeElement:" + str(ae))
layer = js("(function(){var l=document.getElementById('search-layer');return l?l.hidden:false})()")
log("search_layer_hidden_after_open:" + str(layer))
take("v0.6-open")
log("step:overlay_open")

# 2) dispatch REAL input event + read count/status
js("(function(){var i=document.getElementById('search-input');if(i){i.value='';i.focus();i.dispatchEvent(new Event('input',{bubbles:true}));}})()")
time.sleep(0.2)
js("(function(){var i=document.getElementById('search-input');if(i){i.value='battery';i.focus();i.dispatchEvent(new Event('input',{bubbles:true}));}})()")
time.sleep(0.9)
n = js("(function(){return document.querySelectorAll('#search-results li').length;})()")
log("n_after_battery:" + str(n))
st = js("(function(){var s=document.getElementById('search-status');return s?s.textContent:'';})()")
log("status_after_battery:" + str(st))
take("v0.6-count")
log("step:count_status_after_type")

# 3) clear button (dispatch click not .click())
clear_visible = js("(function(){var c=document.getElementById('search-clear');return c&&c.offsetParent!==null;})()")
log("clear_visible:" + str(clear_visible))
if clear_visible:
    js("(function(){var c=document.getElementById('search-clear');if(c){c.dispatchEvent(new MouseEvent('click',{bubbles:true,view:window}));}})()")
    time.sleep(0.3)
    val_after = js("(function(){var i=document.getElementById('search-input');return i?i.value:'';})()")
    log("clear_result_value:" + repr(val_after))
    st_after_clear = js("(function(){var s=document.getElementById('search-status');return s?s.textContent:'';})()")
    log("status_after_clear:" + str(st_after_clear))
    take("v0.6-clear")
log("step:clear")

# 4) Esc = real keydown via cdp
js("(function(){var t=document.getElementById('search-trigger');t&&t.click();})()")
time.sleep(0.3)
cdp("Input.dispatchKeyEvent", type="keyDown", key="Escape", code="Escape", keyCode=27, modifiers=0)
time.sleep(0.3)
hidden_after_esc = js("(function(){var l=document.getElementById('search-layer');return l?l.hidden:true})()")
log("esc_layer_hidden:" + str(hidden_after_esc))
focus_after_esc = js("(function(){var ae=document.activeElement;return ae?ae.id:'';})()")
log("esc_focus_back:" + str(focus_after_esc))
take("v0.6-esc")
log("step:esc")

# 5) / shortcut from body
js("(function(){var t=document.getElementById('search-trigger');t&&t.focus();})()")
time.sleep(0.2)
cdp("Input.dispatchKeyEvent", type="keyDown", key="Slash", code="Slash", keyCode=191, modifiers=0)
time.sleep(0.4)
slash_opens = js("(function(){var l=document.getElementById('search-layer');return l&&!l.hidden;})()")
log("slash_opens_from_body:" + str(slash_opens))
take("v0.6-slash")
log("step:slash")

# 6) scrollWidth + viewport
vw = js("(function(){return window.innerWidth;})()")
log("viewport_width:" + str(vw))
sw = js("(function(){return document.documentElement.scrollWidth;})()")
log("scrollWidth:" + str(sw))
take("v0.6-scrollwidth")
log("step:scrollwidth")

# 7) no-results block
js("(function(){var i=document.getElementById('search-input');i&&(function(){i.value='';i.focus();i.dispatchEvent(new Event('input',{bubbles:true}));}})()")
time.sleep(0.2)
js("(function(){var i=document.getElementById('search-input');if(i){i.value='zzznomatchx';i.focus();i.dispatchEvent(new Event('input',{bubbles:true}));}})()")
time.sleep(0.9)
empty_shown = js("(function(){var e=document.getElementById('search-empty');return e&&e.offsetParent!==null;})()")
log("empty_shown:" + str(empty_shown))
contact_href = js("(function(){var a=document.querySelector('#search-empty a');return a?a.getAttribute('href'):'';})()")
log("contact_href:" + str(contact_href))
take("v0.6-noresults")
log("step:noresults")

summary = "\n".join(report)
Path("/home/ubuntu/androidscroll/v06-PROGRESS.md").write_text(summary)
print(summary)

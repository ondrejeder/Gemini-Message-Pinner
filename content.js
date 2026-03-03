// Global variables
let currentUrl = window.location.href;
const sidebar = document.createElement('div');

// ---------------------------------------------------------
// SVG ICONS
// ---------------------------------------------------------
const ICONS = {
  bookmarkAdd: `<svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>`,
  pinHeader: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M640-480 720-400v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 17l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 56 56-28-27Z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`
};

// ---------------------------------------------------------
// 1. Initialize Sidebar
// ---------------------------------------------------------
sidebar.id = 'my-bookmark-sidebar';
sidebar.innerHTML = `
  <div class="sidebar-header">
    ${ICONS.pinHeader}
    <span>My Pinned Prompts</span>
  </div>
`;
document.body.appendChild(sidebar);

// ---------------------------------------------------------
// STORAGE & LOGIC
// ---------------------------------------------------------

function savePins() {
  const pins = [];
  const items = document.querySelectorAll('.bookmark-item');
  items.forEach(item => {
    pins.push({
      label: item.querySelector('.bookmark-text').innerText,
      fullTextPreview: item.dataset.fullText || "" 
    });
  });
  localStorage.setItem(currentUrl, JSON.stringify(pins));
}

function restorePins() {
  const header = sidebar.querySelector('.sidebar-header');
  sidebar.innerHTML = ''; 
  sidebar.appendChild(header);
  sidebar.style.display = 'none';

  const savedData = localStorage.getItem(currentUrl);
  if (!savedData) return;

  const pins = JSON.parse(savedData);
  if (pins.length > 0) sidebar.style.display = 'block';

  setTimeout(() => {
    pins.forEach(pin => {
      const targetElement = findMessageByText(pin.fullTextPreview);
      if (targetElement) {
        createSidebarItem(targetElement, pin.label, pin.fullTextPreview);
      }
    });
  }, 2000);
}

function findMessageByText(searchText) {
  if (!searchText) return null;
  const candidates = document.querySelectorAll('div, span, p'); 
  for (let el of candidates) {
    if (el.innerText === searchText) return el;
  }
  return null;
}

// ---------------------------------------------------------
// UI CREATION
// ---------------------------------------------------------

function createSidebarItem(targetElement, labelText, fullText) {
  const bookmark = document.createElement('div');
  bookmark.className = 'bookmark-item';
  bookmark.dataset.fullText = fullText;

  const textSpan = document.createElement('span');
  textSpan.className = 'bookmark-text';
  textSpan.innerText = labelText;
  
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'bookmark-actions';

  // Edit Btn
  const editBtn = document.createElement('div');
  editBtn.className = 'bm-action';
  editBtn.innerHTML = ICONS.edit;
  editBtn.onclick = (e) => {
    e.stopPropagation(); 
    const newName = prompt("Rename this pin:", textSpan.innerText);
    if (newName && newName.trim() !== "") {
      textSpan.innerText = newName;
      savePins();
    }
  };

  // Remove Btn
  const removeBtn = document.createElement('div');
  removeBtn.className = 'bm-action';
  removeBtn.innerHTML = ICONS.close;
  removeBtn.onclick = (e) => {
    e.stopPropagation(); 
    bookmark.remove();
    savePins();
    if (sidebar.children.length <= 1) sidebar.style.display = 'none';
  };

  actionsDiv.appendChild(editBtn);
  actionsDiv.appendChild(removeBtn);
  bookmark.appendChild(textSpan);
  bookmark.appendChild(actionsDiv);

  bookmark.onclick = (e) => {
    if (e.target.closest('.bm-action')) return;
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    targetElement.style.transition = "background 0.3s";
    const oldBg = targetElement.style.backgroundColor;
    targetElement.style.backgroundColor = "rgba(168, 199, 250, 0.3)"; 
    setTimeout(() => { targetElement.style.backgroundColor = oldBg; }, 1000);
  };

  sidebar.appendChild(bookmark);
  sidebar.style.display = 'block';
}

function addBookmark(textElement) {
  if (!textElement) {
    alert("Could not find text. Try reloading.");
    return;
  }
  const fullText = textElement.innerText;
  let name = fullText.substring(0, 40).replace(/\n/g, ' ') + "...";
  createSidebarItem(textElement, name, fullText);
  savePins();
}

// ---------------------------------------------------------
// INJECTION LOGIC (ID-Based + Deduplication)
// ---------------------------------------------------------

function injectPinButtons() {
  const allActionButtons = document.querySelectorAll('button[aria-controls^="user-query-content"]');
  
  // MAP to deduplicate: Key = Message ID, Value = The Button Element
  // This ensures we only select ONE button per user message.
  const uniqueMessages = new Map();

  allActionButtons.forEach(btn => {
    const msgId = btn.getAttribute('aria-controls');
    // We overwrite so we get the last one (usually the Edit button), 
    // or you can check if(!has) to keep the first one.
    // Let's stick with the last one as it usually sits on the edge.
    uniqueMessages.set(msgId, btn);
  });

  // Now iterate ONLY through the unique message IDs
  uniqueMessages.forEach((btn, msgId) => {
    const container = btn.parentElement;
    if (!container) return;

    // Check if THIS specific container already has our pin
    if (container.querySelector('.my-bookmark-btn')) return;

    // Create Pin Button
    const pinBtn = document.createElement('div');
    pinBtn.innerHTML = ICONS.bookmarkAdd; 
    pinBtn.className = 'my-bookmark-btn';
    pinBtn.title = "Pin this prompt";
    
    pinBtn.style.cursor = "pointer";
    pinBtn.style.display = "inline-flex";
    pinBtn.style.alignItems = "center";
    pinBtn.style.justifyContent = "center";
    pinBtn.style.width = "40px";  
    pinBtn.style.height = "40px";
    pinBtn.style.borderRadius = "50%";
    pinBtn.style.marginLeft = "4px";
    pinBtn.style.color = "#c4c7c5";
    pinBtn.style.transition = "background 0.2s";

    pinBtn.onmouseover = () => { 
        pinBtn.style.backgroundColor = "rgba(255,255,255,0.08)"; 
        pinBtn.style.color = "#e3e3e3";
    };
    pinBtn.onmouseout = () => { 
        pinBtn.style.backgroundColor = "transparent"; 
        pinBtn.style.color = "#c4c7c5";
    };

    pinBtn.onclick = (e) => {
      e.stopPropagation();
      const textEl = document.getElementById(msgId);
      addBookmark(textEl);
    };

    container.appendChild(pinBtn);
  });
}

function checkUrlChange() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    restorePins();
  }
}

// ---------------------------------------------------------
// RUN
// ---------------------------------------------------------
restorePins();
setInterval(injectPinButtons, 1000); 
setInterval(checkUrlChange, 1000);
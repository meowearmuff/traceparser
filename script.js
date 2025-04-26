const dc = document;
const $ = (s) => dc.querySelector(s);

const show = (element) => element.style.display = "flex";
const hide = (element) => element.style.display = "none";
const toggle = (element) => element.classList.toggle('active');
const removeall = (element) => element.innerHTML = '';
const overlay =  $(".overlay");
const options = $(".optTabs");
const btn_top = $(".topButton");
const btn_back = $(".backButton");
const btn_load = $(".loadButton")
const trans_stat = $(".transStat-container");


var tabid = 0; var walletx;
var address_book = [], actionTypes = {};
var actions = [];
var actionsjson = [];
const input = dc.getElementById('searchInput'), button = dc.getElementById('searchButton');
dc.addEventListener('DOMContentLoaded', () => {
    overlay.style.transition = 'all 0.5s';
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.setHeaderColor('#151b21');
        window.Telegram.WebApp.setBackgroundColor('#151b21');
    } else {
        console.error("Telegram Web App не инициализирован");
    }
});
async function fetchActions(wallet, offset = 0, callback = console.log) {
    if (!wallet) return;
    try {
        const res = await fetch(`https://toncenter.com/api/v3/actions?account=${wallet}&limit=100&offset=${offset}`);
        callback(await res.json(), offset, wallet);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}




button.addEventListener('click', () => {
    const wallet = input.value.trim();
    input.value = "";
    if (!wallet) return;
    fetchActions(wallet, 0, (data, offset, wallet) => {
        if (!data.actions.length) return;
        formatAction(offset, data);
        actionTypes.lastTransition = 100;
        formatStat();
        formatWalletList();
        setLoadButton(wallet);
        loadComments();
        document.querySelector(".targetAddress").textContent = wallet;
        document.querySelector('.targetAddress').style.display = "flex";
        show(btn_load);
    });
});



const selectors = {
    openBtn: '.menuButton',
    backBtn: ".backButton",
    topBtn: ".topButton",
    overlay: '#menuOverlay',
    tabs: { wallets: '#walletsTab', contracts: '#contractsTab', comments: '#commentsTab' },
    containers: { wallets: '.walletList-container', contracts: '.contractList-container', comments: '.commentsList-container' }
};

const elements = {
    openBtn: $(selectors.openBtn),
    topBtn: $(selectors.topBtn),
    backBtn: $(selectors.backBtn),
    overlay: $(selectors.overlay),
    containers: {
        wallets: $(selectors.containers.wallets),
        contracts: $(selectors.containers.contracts),
        comments: $(selectors.containers.comments)
    }
};
const tabActions = {
    wallets: () => showContainer(selectors.containers.wallets),
    contracts: () => showContainer(selectors.containers.contracts),
    comments: () => showContainer(selectors.containers.comments)
};



elements.backBtn.onclick = () => (toggle(overlay), toggle(btn_back), hide(btn_top));




Object.entries(selectors.tabs).forEach(([tab, sel]) => $(sel).addEventListener('click', tabActions[tab]));

function showContainer(active) {
  toggle(overlay);
  toggle(btn_back);
    Object.values(selectors.containers).forEach(c => $(c).style.display = c === active ? 'flex' : 'none');
}

elements.overlay.onscroll = () => elements.topBtn.style.display = elements.overlay.scrollTop > 2000 ? 'flex' : 'none';
function scrollToTop() {
    elements.overlay.scrollTo({ top: 0, behavior: 'smooth' });
}


function loadComments() {
    elements.containers.comments.innerHTML = '';
    
    actionsjson.forEach(action => {
        if (action.details?.comment?.length) {
            const p = Object.assign(document.createElement('p'), { className: 'wallItem' });
            const walletSpan = Object.assign(document.createElement('p'), {
                textContent: action.details.comment,
                style: 'width: calc(100% - 100px); margin: 0; height: 50px; flex: 1; padding: 10px; white-space: pre-wrap; word-wrap: break-word; color: grey;'
            });
            const p2 = Object.assign(document.createElement('p'), { style: 'display: flex; margin: 0;' });
            const nameSpan = Object.assign(document.createElement('span'), {
                textContent: 'Explorer',
                style: 'width: 100%; margin: 0; font-size: 12px; border-left: 2px solid #5b89df; color: #5b89df; padding: 10px; flex: 1; display: flex;'
            });
            nameSpan.onclick = () => window.open(`https://tonscan.org/ru/tx/${action.trace_id}`, '_blank');
            const spanCount = Object.assign(document.createElement('span'), {
                textContent: new Date(action.start_utime * 1000).toLocaleString(),
                style: 'justify-content: right; margin: 0; border-right: 2px solid #5b89df; color: #5b89df; padding: 10px; height: 20px; display: flex;'
            });
            
            p2.append(nameSpan, spanCount);
            p.append(walletSpan, p2);
            elements.containers.comments.appendChild(p);
        }
    });
}


function formatWalletList() {
    elements.containers.wallets.innerHTML = "";
    elements.containers.contracts.innerHTML = "";

    address_book.forEach(item => {
        const p = Object.assign(document.createElement('p'), { className: 'wallItem' });

        const walletSpan = Object.assign(document.createElement('p'), {
            textContent: `${item.base64.toString()} `, style: 'width: calc(100% - 100px); margin: 0; height: 50px; flex: 1; padding: 10px; display: block; white-space: pre-wrap; word-wrap: break-word; color: grey;'
        });


        const p2 = Object.assign(document.createElement('p'), { style: "display:flex; flex: 1 1 1; margin: 0;" });

        const nameSpan = Object.assign(document.createElement('span'), {
            textContent: `${item.dns ? item.dns : ""}`, style: 'width: 100%; margin: 0; border-left: 2px solid #5b89df; color: #5b89df; padding: 10px; flex: 1; display: flex;'
        });

           const spanCount = Object.assign(document.createElement('span'), {
            textContent: item.count + "", style: 'justify-content: right; margin: 0; border-right: 2px solid #5b89df; color: #5b89df; padding: 10px; height: 20px; display: flex;'
        });
        if (item.dns != null) {
            p.style.flexDirection = "column";
            p2.append(nameSpan, spanCount);
        } else {
            p.style.flexDirection = "row";
            p2.append(spanCount);
        }
        p.append(walletSpan, p2)
      if(item.isWallet)  elements.containers.wallets.appendChild(p); else elements.containers.contracts.append(p);
    
    });
}

function formatStat() {
    show(options);
    removeall(trans_stat);

    Object.entries(Parser.ActionTypes).forEach(([key, value]) => {
        if (!value.Count || key === "lastTransition") return;
        createStatItem(key, value.Count)
    });
}

function createStatItem(type, count){
    const p = document.createElement('p');
            p.className = 'stat-item';
            const typeSpan = document.createElement('span');
            typeSpan.className = 'stat-type';
            typeSpan.textContent = type;
            const countSpan = document.createElement('span');
            countSpan.className = 'stat-count';
            countSpan.textContent = count;
            p.append(typeSpan, countSpan);
            p.onclick = () => console.log(Parser.ActionTypes[type].Actions);
            trans_stat.append(p);
        
}




const dateCounts = {};

var Parser = {
    Actions: [],
    ActionTypes: []
}

var actionsarray = [];
var actions2;
function format(){
    data.actions.forEach(action => {

    })
}

function formatAction(offset, data) {
    if (!offset) {
        actionTypes = {};
        actions = [];
        address_book = [];
    }
    actionTypes.total == null ? actionTypes.total = data.actions.length : actionTypes.total += data.actions.length;


    data.actions.forEach(action => {
        Parser.Actions.push(action);
        if(!Parser.ActionTypes[action.type]){
            Parser.ActionTypes[action.type] = {Actions: [], Count: 0};
        }
        Parser.ActionTypes[action.type].Count += 1;
        //if(!Parser.ActionTypes[action.type].Actions) Parser.ActionTypes[action.type].Actions = [];
        Parser.ActionTypes[action.type].Actions.push(action);
        console.log(new Date(action.start_utime * 1000).toLocaleDateString())
        // actionsjson.push(action);
        // actions.push(JSON.stringify(action));
        // 
 
        const date = new Date(action.start_utime * 1000).toLocaleDateString();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // 2. Генерируем все дни 2025 года
    const startDate = new Date(2025, 0, 1); // 1 января 2025
    const endDate = new Date(2025, 11, 31); // 31 декабря 2025
    const dateArray = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toLocaleDateString();
        dateArray.push({
            date: dateStr,
            count: dateCounts[dateStr] || 0
        });
    }
    console.log(Parser.Actions);
    console.log(JSON.stringify(Parser.Actions));
    Object.entries(data.address_book).forEach(([hex, { user_friendly, domain }]) => {
     var count = actions.toString().split(hex).length;
     const existing = address_book.find(item => item.hex === hex);
  
if (existing) {
existing.count = count;
} else {
address_book.push({ base64: user_friendly, hex, dns: domain, isWallet: user_friendly.startsWith("UQ"), count})

}
    });
    function createActivityCalendar() {
        const container = document.getElementById('calendar');
        container.className = 'activity-calendar';

        // Создаем блоки для каждого дня
        dateArray.forEach(item => {
            const day = document.createElement('div');
            day.className = `day count-${Math.min(item.count, 4)}`;
            day.setAttribute('data-tooltip', `${item.date}: ${item.count} actions`);
            container.appendChild(day);
        });
    }

     createActivityCalendar();
}




        // 3. Создаем разметку
     
        // Вызываем функцию для рендеринга

document.addEventListener('keydown', (event) => {
if (event.ctrlKey && event.key === 'q') {
event.preventDefault();
navigator.clipboard.readText()
.then(wallet => {
fetchActions(wallet, 0, (data, offset, wallet) => {
        if(!data || !data.actions) return;
        if (!data.actions.length) return;
        formatAction(offset, data);
        actionTypes.lastTransition = 100;
        formatStat();
        formatWalletList();
        setLoadButton(wallet);
        loadComments();
        document.querySelector(".targetAddress").textContent = wallet;
        document.querySelector('.targetAddress').style.display = "flex";
        document.querySelector('.loadButton').style.display = "flex";
    });
})
.catch(err => {
console.error('Ошибка при чтении буфера: ', err);
});


}
});



function setLoadButton(wallet) {
document.querySelector('.loadButton').onclick = () => fetchActions(wallet, actionTypes.lastTransition, (data, offset) => {
if (!data?.actions?.length) return document.querySelector('.loadButton').style.display = 'none';
formatAction(offset, data);
actionTypes.lastTransition += 100;
formatStat();
formatWalletList();
console.log('fetched');
loadComments();
document.querySelector('.loadButton').style.display = 'flex';
});
}
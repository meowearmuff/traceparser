
var address_book = []
var actionTypes = {}

function sendRequest(lastTransition, walletAddress, func) {
    fetch(`https://toncenter.com/api/v3/actions?account=${walletAddress}&limit=100&offset=${lastTransition}`)
        .then(res => res.json())
        .then(data => func(data, lastTransition, walletAddress))
        .catch(err => console.error('sendRequestError:', err));

    console.log(`https://toncenter.com/api/v3/actions?account=${walletAddress}&limit=100&offset=${lastTransition}`)
}


document.querySelector('input[type="search"]').addEventListener('input', function () {
    var searchInput = document.querySelector('input[type="search"]').value;
    document.querySelector('.search-width').textContent = searchInput.length;
});

document.querySelector('.search-button').addEventListener('click', function () {
    const searchInput = document.querySelector('input[type="search"]').value;
    if (searchInput.length !== 0) {

        sendRequest(0, searchInput, (data, lastTransition, walletAddress) => {
            if (data.actions.length != 0) {


                formatAction(lastTransition, data);  // Форматируем действия
                actionTypes.lastTransition = 100;
                formatStat();  // Форматируем статистику
                formatWalletList();
                // Добавляем кнопку "Продолжить анализ"
                const button = document.createElement('button');
                button.textContent = 'Продолжить анализ';
                button.className = 'contAnalyzeButton';

                // Обработчик клика по кнопке
                button.addEventListener('click', function () {
                    // Добавляем отступ на 100 к последней транзакции и повторно вызываем функции
                    sendRequest(actionTypes.lastTransition, searchInput, (data1, lastTransition1, walletAddress1) => {
                        if (data1.actions.length != 0) {

                            formatAction(lastTransition1, data1);
                            actionTypes.lastTransition += 100;
                            formatStat();
                            formatWalletList();
                            // После выполнения снова добавляем кнопку для продолжения
                            document.querySelector('.statContent').appendChild(button);
                            console.log("yes data")
                        } else {
                            document.querySelector('.contAnalyzeButton').remove();
                            console.log("no data")
                        }
                    });
                });

                // Вставляем кнопку в контейнер
                document.querySelector('.statContent').appendChild(button);
            } else document.querySelector('.contAnalyzeButton').remove();
        });
        console.log(getStatisticsString());
    }
});








function formatStat() {
    document.querySelector('.statContent').innerHTML = "";
    Object.entries(actionTypes).forEach(([type, count]) => {
        if (!count) return;


        const p = Object.assign(document.createElement('p'), { className: 'statItem' });

        const spanType = Object.assign(document.createElement('span'), {
            textContent: `${type} `, style: 'width: 200px; display: flex;'
        });

        const spanCount = Object.assign(document.createElement('span'), {
            textContent: `${count}`, style: 'width: 50px; color: white; text-align: right; display: flex; justify-content: right;'
        });

        p.append(spanType, spanCount);
        document.querySelector('.statContent').appendChild(p);
    });

}

function formatWalletList() {
    document.querySelector('.walletList').innerHTML = "";
    console.log(address_book)
    address_book.forEach(item => {
   


        const p = Object.assign(document.createElement('p'), { className: 'wallItem' });

        const spanType = Object.assign(document.createElement('span'), {
            textContent: `${item.base64.toString()} `, style: 'width: 100%; height: 100%; display: flex;'
        });

        const spanCount = Object.assign(document.createElement('span'), {
            textContent: `${item.dns ? item.dns:""}`, style: 'width: 200px; color: white; text-align: right; display: flex; justify-content: right;'
        });

        p.append(spanType, spanCount);
        document.querySelector('.walletList').appendChild(p);
    });

}

function formatAction(lastTransition, data) {
    if (lastTransition == 0) actionTypes = {}
    data.actions.forEach(action => {
        if (actionTypes[action.type] == undefined) actionTypes[action.type] = 0;
        actionTypes[action.type] += 1;
    });

    // for(var i = 0; i < data.address_book.length; i++) 
   var keys = Object.keys(data.address_book);
    keys.forEach(key => 

    address_book.push({base64: data.address_book[key].user_friendly, hex: key, dns: data.address_book[key].domain}))
    // data.address_book.forEach(wallets => {
    //     console.log(Object.keys(wallets)[0])
    // });
}


function getStatisticsString() {
    return Object.entries(address_book).filter(([_, value]) => value > 0).map(([key, value]) => `${key}: ${value}`).join("\n");
}
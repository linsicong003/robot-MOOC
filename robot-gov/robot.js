const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const sleep = require('system-sleep');
const mail = require('./mail')

const url = `http://www.gdhrss.gov.cn/gwykl/index.html`
const baseUrl = `http://www.gdhrss.gov.cn`
let lastFirst = null
let lastCheck = new Date().getTime()


const getPage = async () => {
    let res = await axios.get(url)
    const timestamp = new Date().getTime()
    
    // 检查是否存活
    if (timestamp - lastCheck > 24 * 60 * 60 * 1000) {
        lastCheck = timestamp
        mail(`${moment().format('MMMM Do YYYY, h:mm:ss a')}服务状态检查`, `服务还活着`)
    }

    if (!res) console.error(moment().format('MMMM Do YYYY, h:mm:ss a'), '无数据')
    const $ = cheerio.load(res.data)

    let nowFirst = $('.leftlist').find('a')[0].attribs || null
    // 如果当前无值
    if (!nowFirst) return
    // 初始值无值
    if (!lastFirst && !nowFirst.title.includes('2020')) {
        lastFirst = nowFirst
        mail(`${moment().format('MMMM Do YYYY, h:mm:ss a')}服务开始启动啦~`, '监听服务启动')
        return
    }
    // 没有更新
    if (nowFirst.href === lastFirst.href && nowFirst.title === lastFirst.title) return
    // 发现更新
    lastFirst = nowFirst
    const mailText = `<center>有新通知啦~</center><p>通知 <b>${nowFirst.title}</b> 更新啦</p><p>通知地址是：${baseUrl + nowFirst.href}</p><p>${moment().format('MMMM Do YYYY, h:mm:ss a')}</p>`
    
    mail(mailText, nowFirst.title)
}

while(true) {
    getPage()
    sleep(5 * 1000)
}

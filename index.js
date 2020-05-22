const fs = require('fs')
const puppeteer = require('puppeteer');

(async () => {
  // 创建一个浏览器实例
  const browser = await (puppeteer.launch({
    //设置超时时间
    timeout: 50000,
    //如果是访问https页面 此属性会忽略https错误
    ignoreHTTPSErrors: true,
    // 打开开发者工具, 当此值为true时, headless总为false
    devtools: false,
    // 关闭headless模式, 不会打开浏览器
    headless: false,
    // 设置默认窗口大小
    defaultViewport: {
      width: 1366,
      height: 768
    }
  }));

  // 新开一个页面实例
  console.log('开始爬取');
  const page = await browser.newPage();

  // 首页执行登录
  await page.goto('https://www.icourse163.org/learn/scnu-1207440802#/learn/forumindex');

  // 获取所有主题讨论
  const allTopic = await getAllTopic(page)

  // 遍历主题获取主题里的所有帖子
  let nowTopic = allTopic.postList[1]

  await page.goto(nowTopic.url);
  // await page.waitForNavigation()
  console.log('开始爬帖子');
  await page.waitForSelector('.m-basepool .m-data-lists>.f-pr')
  
  // 获取当前页的所有帖子（评论也当帖子）
  // 帖子类型 type 1 普通帖子 2 评论回复贴
  // let post = await page.$$eval('.m-basepool .m-data-lists>.f-pr', list => {
  //   return list.map(one => {
  //     const content = one.querySelector('.m-detailInfoItem .j-content')
  //     console.log(content);
  //     return {
  //       content: content.innerHTML
  //     }
  //   })
  // })
  let post = await page.$$eval('.m-basepool .m-data-lists>.f-pr',  (list) => {
    // 解析日期，将所有日期解析成 yyyy-x-xx的格式
    const parseDate = (str) => {
      let now = new Date(),
      nowYear = now.getFullYear(),
      nowMonth = now.getMonth() + 1,
      nowDay = now.getDate()
      // 当天
      if (str.indexOf(':') > -1) return `${nowYear}-${nowMonth}-${nowDay}`
      // 当年
      if (str.indexOf('月') > -1) {
        let tmp = str.split('月')
        let mon = tmp[0]
        let day = tmp[1].split('日')[0]
        return `${nowYear}-${mon}-${day}`
      }
      // 否则是符合格式的
      return str
    }
    
    const one = list[0]
    return {
      content: one.querySelector('.m-detailInfoItem .j-content').innerText,
      author: one.querySelector('.m-detailInfoItem .f-fcgreen').getAttribute('title'),
      date: parseDate(one.querySelector('.m-detailInfoItem .j-time').innerText),
      favour: one.querySelector('.m-detailInfoItem .j-num').innerText
    }
  })
  console.log(post)

  // 关闭浏览器实例
  await browser.close()
})();

// 爬取当页所有标题
const getNowPagePost = async (page, list) => {
  let txt = await page.$$eval('.u-forumlistwrap .u-forumli', list => {
    return list.map( one => {
      const title = one.querySelector('.j-link')
      const name = one.querySelector('.f-fcgreen')
      const date = one.querySelector('.j-txt .f-fc9')
      return {
        title: title.innerText, // 主题标题
        url: `https://www.icourse163.org/learn/scnu-1207440802${title.getAttribute('href')}`, // 主题对应地址
        owner: name.getAttribute('title'), // 主题发起者
        createTime: date.innerText.split(' ')[0] // 主题创建时间
      }
    })
  });
  return list.concat(txt)
}

// 获取所有话题数据
const getAllTopic = async (page) => {
  console.log('开始爬取主题');
  // 爬取话题总列表
  let titleList = []
  // 总页数
  let pageCount = 1

  // 读取该页获取话题信息
  // 第一页直接读取
  titleList = await getNowPagePost(page, titleList)

  // 下一页按钮
  const nextBtn = await page.$('.znxt')
  let nextBtnClass = await page.$eval('.znxt', btn => btn.className.split(' '))

  // 如果下一页还可以按的话就按下一页
  while(!nextBtnClass.includes('js-disabled')) {
    await nextBtn.click()
    await page.waitForSelector('.u-forumlistwrap .u-forumli')
    titleList = await getNowPagePost(page, titleList)
    pageCount++
    nextBtnClass = await page.$eval('.znxt', btn => btn.className.split(' '))
  }
  
  // 将话题总列表写入文件
  fs.writeFileSync('titleList.json', JSON.stringify(titleList))
  console.log(`讨论主题爬取完成，总共${pageCount}页！共有数据${titleList.length}条！`)

  // 返回数据
  return {
    postList: titleList,
    totalPage: pageCount,
    totalPost: titleList.length
  }
}


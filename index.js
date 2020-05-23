/**
 * 中国大学 MOOC 讨论区爬虫
 * 移动学习理论、技术与实践
 *
 * @author ClancyLin
 * @date 2020-05-23
 */

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
  let allTopic = await getAllTopic(page)
  
  // 遍历主题获取主题里的所有帖子
  // 所有帖子
  console.log('开始爬帖子');

  // 遍历主题获取每个主题下的帖子
  const newList = []

  // 循环爬取每个主题下的帖子
  for (let nowTopic of allTopic.topicList) {
    await page.waitFor(1000)
    await page.goto(nowTopic.url)
    // await page.waitForNavigation()
    await page.waitForSelector('.m-basepool .j-list')
  
    let allPost = await getAllPost(page)
    nowTopic.children = allPost
  
    newList.push(nowTopic)
  }
  
  allTopic.topicList = newList
    
  // 将最终数据写入 data.json
  console.log(newList.length)
  fs.unlinkSync('data.json')
  await page.waitFor(1000)
  fs.writeFileSync('data.json', JSON.stringify(allTopic))
  
  // 关闭浏览器实例
  await browser.close()
})();

// 爬取当页所有标题
const getNowPageTopic = async (page, list) => {
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
  titleList = await getNowPageTopic(page, titleList)

  // 下一页按钮
  const nextBtn = await page.$('.znxt')
  let nextBtnClass = await page.$eval('.znxt', btn => btn.className.split(' '))

  // 如果下一页还可以按的话就按下一页
  while(!nextBtnClass.includes('js-disabled')) {
    await nextBtn.click()
    await page.waitForSelector('.u-forumlistwrap .u-forumli')
    titleList = await getNowPageTopic(page, titleList)
    pageCount++
    nextBtnClass = await page.$eval('.znxt', btn => btn.className.split(' '))
  }
  
  // 将话题总列表写入文件
  fs.unlinkSync('titleList.json')
  await page.waitFor(1000)
  fs.writeFileSync('titleList.json', JSON.stringify(titleList))
  console.log(`讨论主题爬取完成，总共${pageCount}页！共有数据${titleList.length}条！`)

  // 返回数据
  return {
    topicList: titleList,
    totalPage: pageCount,
    totalPost: titleList.length
  }
}

// 获取当前页的所有帖子（评论帖子放在comment属性下）
// 帖子类型 type 1 普通帖子 2 评论回复贴
const getNowPagePost = async (page) => {
  let post = await page.$$eval('.m-basepool .m-data-lists>.f-pr',  (list) => {
    // 如果没有评论则填充空数组
    if (list.length === 0) return []
    
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

    // 使用名字+内容前十个字的hash来生成id
    const hashCode = (s) => {
      return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    }

    return list.map( one => {
      // 当次爬出的帖子
      let tmp = {}
      
      // 生成普通帖子
      const content = one.querySelector('.m-detailInfoItem .j-content').innerText
      const author = one.querySelector('.m-detailInfoItem .f-fcgreen').getAttribute('title')
      const date = parseDate(one.querySelector('.m-detailInfoItem .j-time').innerText)
      const favour = one.querySelector('.m-detailInfoItem .j-num').innerText
      const id = String(Math.abs(hashCode(date + content.substr(0, 10))))
      tmp = { content, author, date, favour, id, type: 1 }
  
      // 查找有无评论帖，评论贴比普通帖子多 fatherId：评论的帖子ID
      // 生成评论帖子
      const commentWrap = one.querySelector('.m-commentWrapper')
      let commentSearchList = []
  
      console.log(commentWrap);
      
      // 存在评论区才爬
      if (commentWrap) {
        const commentList = commentWrap.querySelectorAll('.m-detailInfoItem')
        commentList.forEach(item => {
          const commentContent = item.querySelector('.m-detailInfoItem .j-content').innerText
          const commentAuthor = item.querySelector('.m-detailInfoItem .f-fcgreen').getAttribute('title')
          const commentDate = parseDate(item.querySelector('.m-detailInfoItem .j-time').innerText)
          const commentFavour = item.querySelector('.m-detailInfoItem .j-num').innerText
          const commentId = id + String(Math.abs(hashCode(date + content.substr(0, 10))))
          commentSearchList.push({ 
            content: commentContent, 
            author: commentAuthor, 
            date: commentDate, 
            favour: commentFavour, 
            id: commentId, 
            fatherId: id, 
            type: 2
          })
        })
      }
      tmp.comment = commentSearchList

      // 返回该条评论
      return tmp
    })
  })
  return post
}

// 获取所有帖子
// 并将其挂载在主题下
const getAllPost = async (page) => {
  // 爬取帖子总列表
  let allPostList = []
  // 总页数
  let pageCount = 1
  
  await page.waitForSelector('.znxt')
  // 读取该页获取帖子信息
  // 第一页直接读取
  allPostList = allPostList.concat(await getNowPagePost(page))

  // 下一页按钮
  const btnList = await page.$$('.znxt')
  const nextBtn = await btnList[btnList.length-1]
  let nextBtnClass = await page.$$eval('.znxt', btnList => btnList[btnList.length-1].className.split(' '))
  

  // 如果下一页还可以按的话就按下一页
  while(!nextBtnClass.includes('js-disabled')) {
    await nextBtn.click()
    await page.waitForSelector('.m-basepool .j-list')
    await page.waitFor(1000)

    allPostList = allPostList.concat(await getNowPagePost(page))
    
    pageCount++
    nextBtnClass = await page.$$eval('.znxt', btnList => btnList[btnList.length-1].className.split(' '))
  }
  
  console.log(`当前主题爬取完成，总共${pageCount}页！共有帖子${allPostList.length}条！`)
  return allPostList
}

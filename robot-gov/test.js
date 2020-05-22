const axios = require('axios');

 const test = async () => {
    let res = await axios.get('http://www.gdhrss.gov.cn/gwykl/index.html')
    return Promise.resolve('')
}

console.log(test())
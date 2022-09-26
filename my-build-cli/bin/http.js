const axios = require('axios');

axios.interceptors.response.use((res) => {
  return res.data;
});

// 获取git上的项目列表
async function getRepolist() {
  return axios.get('https://api.github.com/orgs/yuan-cli/repos');
}

module.exports = {
  getRepolist
};

const config = {
  apiBaseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'https://localhost:7103'
    : 'https://ai-film-recommendations-g3awbycwd5anhbej.swedencentral-01.azurewebsites.net'
};

export default config;
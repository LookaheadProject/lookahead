import { int } from 'aws-sdk/clients/datapipeline';
import { nextUntil } from 'cheerio/lib/api/traversing';
import request from 'request';
const totp = require("totp-generator");
const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');


/**
 * Retrieves the HTML source code for a given URL.
 * @param url The url to retrieve the HTML source code for
 */
export const getHTML = (url: string): Promise<string> => {
  // Sets up request so it uses a browser-like user agent
  const customHeaderRequest = request.defaults({
    headers: {
      'User-Agent':
        // tslint:disable-next-line:max-line-length
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
    },
  });
  return new Promise((resolve, reject) => {
    // Attempt to retrieve HTML
    customHeaderRequest.get(url, (error, response, body) => {
      // If error, pass to promise reject
      if (error) {
        reject(error);
      }
      // Send back HTML if successful
      resolve(body);
    });
  });
};

const loginURL = "https://sso.unimelb.edu.au/";
const twofactorURL = "https://sso.unimelb.edu.au/signin/verify/google/token%3Asoftware%3Atotp/";
const googleAuthFieldXpath = '/html/body/div[2]/div/div[2]/div/div/form/div[1]/div[2]/div[1]/div[2]/span/input';
const googleAuthButtonXpath = '/html/body/div[2]/div/div[2]/div/div/form/div[2]/input';

// TODO: Make these all environment vars
const USERNAME = "Insert your login username"
const PASSWORD = "Insert your uni password"
const SECRET = "Insert your google authenticator secret";

const screen = {
  width: 640,
  height: 480
};




// let isApmuiSessionErrorPage = async () => {
//   return driver.findElements(webdriver.By.className('apmui-button-submit')).then(function(rets : any) {
//     // console.log(rets.length);
//     return rets.length > 0;
//   })
// }
// // let isApmuiSessionErrorPage = function() {
// //   await driver.findElements(webdriver.By.className('apmui-button-submit')).length > 0;
// // }

// let isLoginPage = function() {
//   return driver.findElements(webdriver.By.id('okta-signin-username')).then(function(rets : any) {
//     return rets.length > 0;
//   })
// }

// let isGoogleAuthPage = function(){
//   return driver.findElements(webdriver.By.className('mfa-google-auth')).then(function(rets : any) {
//     return rets.length > 0;
//   })
// }

// let isSWSPage = function(swsURL : string){
//   return driver.getCurrentUrl().then(function(url : string){
//     return url === swsURL;
//   })
// }

export const getHTMLpastSSO = async (year: int, code: string): Promise<string> => {

  const swsURL = `https://sws.unimelb.edu.au/${year}/Reports/List.aspx?objects=${code}&weeks=1-52&days=1-7&periods=1-56&template=module_by_group_list`;

  let driver = new webdriver.Builder().
  withCapabilities(webdriver.Capabilities.firefox()).
  // setFirefoxOptions(new firefox.Options().headless().windowSize(screen)).
  build();

  try {
    
    let ret = '';
    await driver.get(swsURL);

    await driver.wait( function(){ 
      return driver.findElements(webdriver.By.id('okta-signin-username')).then(function(rets : any) {
        return rets.length > 0;
      }) || driver.findElements(webdriver.By.className('mfa-google-auth')).then(function(rets : any) {
        return rets.length > 0;
      }) || driver.getCurrentUrl().then(function(url : string){
        return url === swsURL;
      })
    },4000);

    // // Wait for the driver to either get on the signin page, the 2fa page, or the page we want to scrape.
    // await driver.wait( function(){ 
    //   return driver.findElements(webdriver.By.className('apmui-button-submit')).then(function(rets : any) {
    //     return rets.length > 0;
    //   }) || driver.findElements(webdriver.By.id('okta-signin-username')).then(function(rets : any) {
    //     return rets.length > 0;
    //   }) || driver.findElements(webdriver.By.className('mfa-google-auth')).then(function(rets : any) {
    //     return rets.length > 0;
    //   }) || driver.getCurrentUrl().then(function(url : string){
    //     return url === swsURL;
    //   })
    // },4000);
    // // await driver.sleep(1000);
    // // console.log(await isApmuiSessionErrorPage());
    // // await driver.wait( function(){ 
    // //   isApmuiSessionErrorPage() || 
    // //   isLoginPage() || 
    // //   isGoogleAuthPage() || 
    // //   isSWSPage(swsURL)
    // // },4000, "First wait timed out");

    // if (await isApmuiSessionErrorPage()){
    //   await driver.findElement(webdriver.By.className('apmui-button-submit')).click();
    //   await driver.wait( function(){ 
    //     return driver.findElements(webdriver.By.id('okta-signin-username')).then(function(rets : any) {
    //       return rets.length > 0;
    //     }) || driver.findElements(webdriver.By.className('mfa-google-auth')).then(function(rets : any) {
    //       return rets.length > 0;
    //     }) || driver.getCurrentUrl().then(function(url : string){
    //       return url === swsURL;
    //     })
    //   },4000);
    // }
    // await driver.sleep(1000);

    if (await driver.getCurrentUrl() == loginURL) {
      
      // console.log(await driver.getPageSource());
      // await driver.findElement(webdriver.By.name('Continue')).click();
      // console.log(await driver.getPageSource());

      // I might need to wait a tiny bit for this to be interactible
      await driver.sleep(100);
      await driver.findElement(webdriver.By.id('okta-signin-username')).sendKeys(USERNAME);

      await driver.findElement(webdriver.By.id('okta-signin-password')).sendKeys(PASSWORD);
      // await driver.sleep(1000);
      
      await driver.findElement(webdriver.By.id('okta-signin-submit')).click();

      // Wait for the driver to get to 2FA screen or the page we want to scrape
      await driver.wait( function(){
        return driver.findElements(webdriver.By.className('mfa-google-auth')).then(function(rets : any) {
          return rets.length > 0;
        }) || driver.getCurrentUrl().then(function(url : string){
          return url === swsURL;
        })
      },4000, "Second wait timed out");

    }

    // await driver.sleep(4000);

    // if (await driver.getCurrentUrl() == twofactorURL){
    if ((await driver.findElements(webdriver.By.className('mfa-google-auth'))).length > 0){
      // console.log("Gothere\n\n\n\n");
      // await driver.sleep(500);
      await driver.findElement(webdriver.By.xpath(googleAuthFieldXpath)).sendKeys(totp(SECRET));
      // await driver.sleep(500);
      await driver.findElement(webdriver.By.xpath(googleAuthButtonXpath)).click();
          // Wait for the driver to get to 2FA screen or the page we want to scrape
      await driver.wait( function(){
        return driver.getCurrentUrl().then(function(url : string){
          return url === swsURL;
        })
      },4000,"Third wait timed out");
    }
    // you seem to still need to wait a bit for it to load
    await driver.sleep(300);
    ret = await driver.getPageSource();
    await driver.quit();

    return ret;
  } catch (err) {
    await driver.quit();    
    console.log("I actually threw an error\n\n\n");
    throw err;
  } 
};



// getHTMLpastSSO(2023, 'MAST20005').then(function (response) {
//   console.log(response);
// }).catch(function (err) {
//   console.log(err);
// }
//   );

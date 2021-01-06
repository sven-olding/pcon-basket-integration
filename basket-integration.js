var basketSession = null;
var basketWindow = null;
var basketFrame = null;

var obkFile = null;

function startBasketIntegration(file) {
  //get basket window for message communication
  basketFrame = document.getElementById("basketFrame");
  basketFrame.src =
    "https://integration.basket.pcon-solutions.com/v2.3/?mode=integration";
  basketFrame.style.position = "fixed";
  basketFrame.style.top = "0";
  basketFrame.style.width = "100%";
  basketFrame.style.height = "100%";
  basketFrame.style.display = "block";

  basketWindow = basketFrame.contentWindow;

  if (file) {
    obkFile = file;
  }

  //create session object
  basketSession = new egr.wcf.eaiws.EaiwsSession();

  //register message handler to receive messages from basket
  window.addEventListener("message", onMessageReceive);
}
async function onMessageReceive(pEvent) {
  //check if message is coming from basket
  if (pEvent.source !== basketWindow) return;
  handleMessage(pEvent.data);
}

async function handleMessage(pMessage) {
  console.dir(pMessage);

  //basket requested the configuration, prepare configuration and send it to basket
  if (pMessage.type === "wbkHost.getConfiguration") {
    console.log("Basket version: " + pMessage.parameter.appVersion);
    console.log(
      "Api version: " +
        pMessage.parameter.messageApiVersion.major +
        "." +
        pMessage.parameter.messageApiVersion.minor
    );
    await prepareConfiguration();
  }

  //editing is finished
  if (pMessage.type === "wbkHost.done") {
    //close/hide basket
    basketFrame.src = "";
    basketFrame.style.display = "none";

    printAllItemsAndCloseSession();
  }
}

async function prepareConfiguration() {
  //option1: create session using gatekeeper, see gatekeeper documentation: https://eaiws-server.pcon-solutions.com/doc/v2
  let tGatekeeperId = "wbk_demo";
  let tPConLoginToken = undefined;
  await connectToGatekeeper(tGatekeeperId, tPConLoginToken);

  if (!obkFile) {
    sendDefaultValues();
  } else {
    const uploadUrl = await basketSession.session.getUploadURL("Project");
    const data = { method: "PUT", body: obkFile };

    const resp = await fetch(uploadUrl, data);
    console.log(resp);

    const loadSessionResult = await basketSession.session.loadSession(
      uploadUrl
    );
    console.log("load session result");
    console.log(loadSessionResult);
  }
  sendConfigurationMessage();
}

function connectToFallbackGatekeeper(gatekeeperId, pConLoginToken) {
  let tOptions = {
    accessToken: pConLoginToken,
  };
  let tPromise = egr.wcf.utils.async
    .ajax(
      "POST",
      "https://eaiws-server-fallback.pcon-solutions.com/v2/session/" +
        gatekeeperId,
      tOptions,
      {
        dataType: "json",
      }
    )
    .then(function (pResponse) {
      basketSession.connect(
        pResponse.server,
        pResponse.sessionId,
        pResponse.keepAliveInterval * 1000
      );
    });
  return tPromise;
}

function connectToGatekeeper(gatekeeperId, pConLoginToken) {
  let tOptions = {
    accessToken: pConLoginToken,
  };
  let tPromise = egr.wcf.utils.async
    .ajax(
      "POST",
      "https://eaiws-server.pcon-solutions.com/v2/session/" + gatekeeperId,
      tOptions,
      {
        dataType: "json",
        retryAttempts: 0,
        timeout: 10000,
      }
    )
    .then(function (pResponse) {
      basketSession.connect(
        pResponse.server,
        pResponse.sessionId,
        pResponse.keepAliveInterval * 1000
      );
    })
    .catch(function (pError) {
      console.log(
        "Failed to start gatekeeper session, using fallback server: " + pError
      );
      return connectToFallbackGatekeeper(gatekeeperId, pConLoginToken);
    });

  return tPromise;
}

async function printAllItemsAndCloseSession() {
  const addrData = await basketSession.project.getAddressData();
  console.log("address data:");
  console.log(addrData);

  const projectData = await basketSession.project.getProjectData();
  console.log("project data");
  console.log(projectData);

  const allItems = await basketSession.basket.getAllItems();
  for (var i = 0; i < allItems.length; ++i) {
    var tDiv = document.createElement("div");
    tDiv.innerText = i + " " + allItems[i].label;
    document.body.appendChild(tDiv);
  }

  // generate pdf
  const baseUrl = new URL(basketSession.session.url).origin;
  const reportTemplateName = "pCon_basket_Standard";
  const requestUrl =
    baseUrl +
    "/EAIWS/plugins/Reporter/template/" +
    reportTemplateName +
    "/generate";
  const sessionId = basketSession.session.sessionId;
  const calcScheme = "STDB2B_WBK";

  const postData = {
    sessionId: sessionId,
    calculationScheme: calcScheme,
    preferredImageColumn: "cc080d73-88f4-4bfc-8ec1-e7e2ad30739a",
    externalRefColumn: "c962203c-7e83-4a2f-8060-acaa4a06c921",
  };
  const fetchParams = {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    method: "POST",
    body: JSON.stringify(postData),
  };
  const resp = await fetch(requestUrl, fetchParams);
  console.log(resp);
  if (resp && resp.ok) {
    const pdfUrl = await resp.text();
    window.open(pdfUrl, "_blank");
  }

  const obkUrl = await basketSession.session.saveSession();
  if (obkUrl) {
    document.getElementById("downloadFrame").src = obkUrl;
  }

  //close the session
  window.setTimeout(function () {
    basketSession.close();
    window.removeEventListener("message", onMessageReceive);
  }, 1000);
}
function sendConfigurationMessage() {
  const tMessage = {
    type: "wbk.configuration",
    parameter: {
      application: {
        theme: {
          //use custom application colors
          primaryColor: "#00A000",
          appBarColor: "#505050",
        },
        showUser: true,
      },
      user: {
        name: "user@example.com",
        fullName: "Example User",
        restrictions: [
          "project.customer.search.edit",
          "project.data.projectName.edit",
          "project.data.projectNumber.edit",
          "project.partyInCharge.edit",
        ],
      },
      eaiws: {
        baseUrl: basketSession.baseUrl,
        sessionId: basketSession.session.sessionId,
        keepAliveInterval: 0, //disable keep alive, its already handled on our side
      },
      project: {
        title: "TITEL",
        titleEditable: false,
        applySessionDefaults: true, //start new project
      },
    },
  };
  basketWindow.postMessage(tMessage, "*");
}
function sendDefaultValues() {
  let pd = new egr.wcf.eaiws.project.ProjectData();
  Object.assign(pd, getProjectData());
  basketSession.project.setProjectData(pd);

  let cd = new egr.wcf.eaiws.project.ContactData();
  Object.assign(cd, getContactData());

  let commAddrArray = new Array();
  let commDataObjArr = getCommunicationData();
  for (let i = 0; i < commDataObjArr.length; i++) {
    let comd = new egr.wcf.eaiws.project.CommAddress();
    Object.assign(comd, commDataObjArr[i]);
    commAddrArray.push(comd);
  }
  cd.commAddresses = commAddrArray;

  let contacts = new Array(cd);
  let ad = new egr.wcf.eaiws.project.AddressData();
  Object.assign(ad, getAddressData());
  ad.contacts = contacts;

  basketSession.project.setAddressData(ad);

  let userData = new egr.wcf.eaiws.project.ContactData();
  Object.assign(userData, getContactDataInCharge());

  commAddrArray = new Array();
  commDataObjArr = getCommunicationDataInCharge();
  for (let i = 0; i < commDataObjArr.length; i++) {
    let comd = new egr.wcf.eaiws.project.CommAddress();
    Object.assign(comd, commDataObjArr[i]);
    commAddrArray.push(comd);
  }
  userData.commAddresses = commAddrArray;

  contacts = new Array(userData);
  ad = new egr.wcf.eaiws.project.AddressData();
  Object.assign(ad, getAddressDataInCharge());
  ad.contacts = contacts;

  basketSession.project.setAddressData(ad);

  basketSession.project.setProjectText(getHeaderText());
  basketSession.project.setProjectText(getFooterText());
}

getProjectData = () => {
  let projData = {};
  projData.company = "FIRMENNAME";
  projData.customerNumber = "1234";
  projData.externalReferenceNumber = "ID12345";
  projData.projectName = "PROJEKTNAME";
  projData.projectNumber = "Projektnummer";
  projData.description = "Beschreibung";
  projData.projectDate = new Date();
  return projData;
};

getAddressData = () => {
  let addrData = {};
  addrData.addressType = "SoldTo";
  addrData.name1 = "Name 1";
  addrData.street = "Musterstr. 123";
  return addrData;
};

getAddressDataInCharge = () => {
  let addrData = {};
  addrData.addressType = "InCharge";
  addrData.name1 = "Lieferant";
  addrData.street = "Lieferallee 567";
  return addrData;
};

getContactDataInCharge = () => {
  let conData = {};
  conData.contactType = "Support";
  conData.firstName = "Frau";
  conData.lastName = "Sachbearbeiter";
  return conData;
};

getCommunicationDataInCharge = () => {
  let commData = new Array();

  commData.push({ value: "LieferantMail", type: "EMail", scope: "Business" });

  return commData;
};

getCommunicationData = () => {
  let commData = new Array();

  commData.push({ value: "Mail", type: "EMail", scope: "Business" });
  commData.push({ value: "Festnetz", type: "Phone", scope: "Business" });
  commData.push({ value: "Mobil", type: "Mobile", scope: "Business" });
  commData.push({ value: "Homepage", type: "WWW", scope: "Business" });

  return commData;
};

getContactData = () => {
  let conData = {};
  conData.contactType = "Support";
  conData.firstName = "Vorname";
  conData.lastName = "Nachname";
  return conData;
};

getHeaderText = () => {
  return getProjectText("HeaderText");
};

getFooterText = () => {
  return getProjectText("FooterText");
};

getProjectText = (textType) => {
  let projectText = new egr.wcf.eaiws.project.ProjectText();
  projectText.type = textType;

  let formattedText = new egr.wcf.eaiws.project.FormattedText();
  formattedText.format = "XML";
  formattedText.language = "de";
  formattedText.value =
    '<?xml version="1.0" ?><iml><p>' +
    textType +
    "<br />" +
    "<br /><br /><i>bla 2<br />bla 3</i><br />4<br />5<br /><br />----------------------------------------------------------------------------------------------------------------------------------------------" +
    "</p></iml>";

  projectText.texts = [formattedText];

  console.log(projectText);
  return projectText;
};

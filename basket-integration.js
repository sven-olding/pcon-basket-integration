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

getProjectData = () => {
  let projData = new egr.wcf.eaiws.project.ProjectData();
  projData.company = "FIRMENNAME";
  projData.customerNumber = "1234";
  projData.externalReferenceNumber = "ID12345";
  projData.projectName = "PROJEKTNAME";
  projData.projectNumber = "Projektnummer";
  projData.description = "Beschreibung";
  projData.projectDate = new Date();
  return projData;
};

getAddressData() = () => {
  let addrData = new egr.wcf.eaiws.project.AddressData();
  addrData.addressType = "SoldTo";
  addrData.name1 = "Name 1";
  addrData.street = "Musterstr. 123";
  return addrData;
};

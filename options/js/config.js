const storeData = await getStore("sidePanelOpenOn");

const autoSummarizerSwitch = eId("open_sidepanel");
autoSummarizerSwitch.checked = storeData.sidePanelOpenOn;
$on(autoSummarizerSwitch, "change", ({ target }) => setStore({ sidePanelOpenOn: target.checked }));

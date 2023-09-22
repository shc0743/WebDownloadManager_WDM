const IDRange = [3001, 4000];

export const main = (async function () {
// FUxK YOU, VSCode auto intend
void (0);
void (0);
    
console.log('network ruleset checker is running at', Date.now());

const ruleset = await (await fetch(chrome.runtime.getURL('/ext/parser/network_request_helper.json'))).json();
if (!ruleset || !ruleset.version) {
    throw new Error('Failed to get network ruleset');
}
const ruleset_version = ruleset.version;


let currentRulesetVersion = +(await storage.currentRulesetVersion);
// if (isNaN(currentRulesetVersion) || currentRulesetVersion < ruleset_version)
{
    updateRuleset().then(() => console.log('dynamic rule updated successfully'));
}


async function updateRuleset() {
    const rules = ruleset.rules;
    const current = await chrome.declarativeNetRequest.getDynamicRules();
    const deleteList = [];
    for (const i of current) {
        if (i.id >= IDRange[0] && i.id <= IDRange[1]) deleteList.push(i.id);
    }
    return await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: deleteList,
        addRules: rules,
    });
}



});

const alarmName = 'networkRequestHelper_v1';
chrome.alarms.get(alarmName).then(r => {
    if (!r) {
        chrome.alarms.create(alarmName, {
            when: Date.now() + 2000,
            periodInMinutes: 60,
        }).then(() => console.log('alarm', alarmName, 'created successfully'));
    }
});
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name !== alarmName) return;
    setTimeout(main);
});
setTimeout(main);

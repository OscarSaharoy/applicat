
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

async function togglePane() {
    const { showApplicatPane } = await extensionAPI.storage.local.get({ showApplicatPane: true });
    await extensionAPI.storage.local.set({ showApplicatPane: !showApplicatPane });

    const [ tab ] = await extensionAPI.tabs.query({ active: true, lastFocusedWindow: true });
    extensionAPI.tabs.sendMessage( tab.id, { showApplicatPane: !showApplicatPane } );
}

extensionAPI.action.onClicked.addListener( togglePane );

function onMessage( data, sender, sendResponse ) {
    if( data === "options" ) extensionAPI.runtime.openOptionsPage();
}

extensionAPI.runtime.onMessage.addListener( onMessage );

async function onStorageChange( changes, areaName ) {
    if( areaName === "local" && changes.applicatButtonMap && !changes.applicatButtonMap.newValue ) {
        console.log( "Detected storage cleared - resetting defaults" );
        await extensionAPI.storage.local.set({
            applicatButtonMap: defaultButtonMap,
            applicatPrompts: defaultPrompts,
        });
    }
}

extensionAPI.storage.onChanged.addListener( onStorageChange );



const defaultCoverLetterPrompt = `
Hi, I have found my dream job and I'm really excited to apply :)
Please could you help me write a really great cover letter for this role?

Here is some information about me:

{{ buttons_info }}



Here is the text from the website of the job listing:


{{ page_content }}



So above is the job listing, and some information about me.
Please could you write me a really great cover letter for this role? Please don't reuse wording directly from the job listing,
and please respond with just the cover letter and no other text.
`;

const defaultAnswerQuestionPrompt = `
Hi, I have found my dream job and I'm really excited to apply :)
Please could you help me answer an application question for the role?


Here is some information about me:

{{ buttons_info }}



Here is the text from the website of the job listing:


{{ page_content }}



So above is the job listing and some information about me.
Please could you help me answer this application question for the role? Please don't reuse wording directly from the job listing,
and please respond with just the answer and no other text. The question is:
`;

const defaultPrompts = {
    coverLetterPrompt: defaultCoverLetterPrompt,
    answerQuestionPrompt: defaultAnswerQuestionPrompt,
};

const defaultButtonMap = [
    {
        label: "Full Name",
        copyText: "Oscar Saharoy",
    },
    {
        label: "First Name",
        copyText: "Oscar",
    },
    {
        label: "Last Name",
        copyText: "Saharoy",
    },
    {
        label: "Email",
        copyText: "osaharoy@gmail.com",
    },
    {
        label: "Phone Number",
        copyText: "+447890123456",
    },
    {
        label: "Linkedin",
        copyText: "https://www.linkedin.com/in/oscar-saharoy/",
    },
    {
        label: "Location",
        copyText: "London, UK",
    },
    {
        label: "Notice Period",
        copyText: "3 Months",
    },
];

async function onInstall() {

    console.log( "Extension installed!", new Date() );

    const { applicatButtonMap, applicatPrompts } =
        await extensionAPI.storage.local.get({
            applicatButtonMap: defaultButtonMap,
            applicatPrompts: defaultPrompts,
        });

    console.log( "Setting defaults:", applicatButtonMap, applicatPrompts );

    await extensionAPI.storage.local.set({
        applicatButtonMap,
        applicatPrompts,
    });

    console.log( "Defaults set successfully!" );
};

extensionAPI.runtime.onInstalled.addListener( onInstall );

let buttonMap = [];
let prompts = {};

function writeError( str ) {
    document.querySelector( "#error" ).textContent = str;
}

const withHandleError = func => async ( ...args ) => {
    try {
        const res = await func( ...args );
        return res;
    } catch( error ) {
        writeError( error.toString() );
    }
}

function setSaving() {
    document.getElementById( "save-indicator" ).classList.add( "saving" );
    document.getElementById( "save-indicator" ).classList.remove( "saved" );
}

function setSaved() {
    document.getElementById( "save-indicator" ).classList.remove( "saving" );
    document.getElementById( "save-indicator" ).classList.add( "saved" );
}

async function onInputChange( buttonIndex, key, newValue ) {
    buttonMap[ buttonIndex ][ key ] = newValue;
    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    setSaving();
    await extensionAPI.storage.local.set({ applicatButtonMap: buttonMap });
    setSaved();
}

async function removeButton( buttonIndex ) {
    buttonMap.splice( buttonIndex, 1 );
    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    setSaving();
    await extensionAPI.storage.local.set({ applicatButtonMap: buttonMap });
    await createButtons();
    setSaved();
}

async function addButton() {
    buttonMap.push( { label: "", copyText: "" } );
    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    setSaving();
    await extensionAPI.storage.local.set({ applicatButtonMap: buttonMap });
    await createButtons();
    setSaved();
}

async function createButtons() {

    [ ...document.querySelectorAll( ".button-setup.clone") ].forEach( elm => elm.remove() );

    const form = document.querySelector( "form" );
    const buttonTemplate = document.querySelector( ".button-setup#button-template" );

    for( const [ buttonIndex, { label, copyText } ] of buttonMap.entries() ) {
        const newButton = buttonTemplate.cloneNode(true);
        newButton.style.display = "grid";
        newButton.id = `button-setup-${buttonIndex}`;
        newButton.querySelector( ".label" ).value = label;
        newButton.querySelector( ".copy-text" ).value = copyText;
        newButton.classList.add( "clone" );

        newButton.querySelector( "input.label" ).oninput =
            withHandleError( e => onInputChange( buttonIndex, "label", e.target.value ) );
        newButton.querySelector( "input.copy-text" ).oninput =
            withHandleError( e => onInputChange( buttonIndex, "copyText", e.target.value ) );
        newButton.querySelector( ".remove" ).onclick =
            withHandleError( e => removeButton( buttonIndex ) );
            
        form.insertBefore( newButton, buttonTemplate );
    }

    form.querySelector( "button#add" ).onclick = withHandleError( e => addButton() );
}

async function updatePrompt( key, newValue ) {
    prompts[ key ] = newValue;
    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    setSaving();
    await extensionAPI.storage.local.set({ applicatPrompts: prompts });
    setSaved();
}

async function createPrompts() {

    const coverLetterPromptTextarea = document.querySelector( "textarea#cover-letter-prompt" );
    const answerQuestionPromptTextarea = document.querySelector( "textarea#answer-question-prompt" );

    coverLetterPromptTextarea.value = prompts.coverLetterPrompt;
    answerQuestionPromptTextarea.value = prompts.answerQuestionPrompt;

    coverLetterPromptTextarea.oninput = withHandleError( e => updatePrompt( "coverLetterPrompt", e.target.value ) );
    answerQuestionPromptTextarea.oninput = withHandleError( e => updatePrompt( "answerQuestionPrompt", e.target.value ) );
}

async function resetSettings() {
    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    setSaving();
    await extensionAPI.storage.local.clear();
    await new Promise( resolve => setTimeout( resolve, 100 ) );
    await createButtons();
    await createPrompts();
    setSaved();
}

async function runSettings() {

    const extensionAPI = typeof browser !== "undefined" ? browser : chrome;
    document.querySelector( "img#logo" ).src = extensionAPI.runtime.getURL("assets/icon.svg");
    document.querySelector( "#add img" ).src = extensionAPI.runtime.getURL("assets/add.svg");
    document.querySelector( "#reset img" ).src = extensionAPI.runtime.getURL("assets/reset.svg");
    document.querySelector( "button.remove img" ).src = extensionAPI.runtime.getURL("assets/x.svg");

    const { applicatButtonMap, applicatPrompts } =
        await extensionAPI.storage.local.get({ applicatButtonMap: [], applicatPrompts: {} });
    buttonMap = applicatButtonMap;
    prompts = applicatPrompts;

    await createButtons();
    await createPrompts();
    
    document.querySelector( "form button#reset" ).onclick = withHandleError( resetSettings );
}

( async () => {
    await withHandleError( runSettings )();
} )();


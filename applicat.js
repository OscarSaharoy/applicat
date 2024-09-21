const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

const copy = str => 
    navigator.clipboard.writeText( str );

const getPageContent = () => {
    window.getSelection().selectAllChildren(document.body)
    const text = window.getSelection().toString();
    window.getSelection().empty();
    return text;
}

const formatButtonMap =
    buttonMap => buttonMap.reduce(
        (str, { label, copyText }) => str + `${label}: ${copyText}\n`, ""
    );

const formatPrompt =
    ( prompt, buttonMap ) =>
        prompt
            .replaceAll( "{{ buttons_info }}", formatButtonMap(buttonMap) )
            .replaceAll( "{{ page_content }}", getPageContent() );


const pane = document.createElement( "div" );
pane.id = "applicat-pane";

pane.innerHTML = `

<style>
#applicat-pane {
    position: fixed;
    top: 0;
    left: 0;
    display: grid;
    gap: 4px;
    grid-auto-flow: row;
    justify-content: center;
    z-index: 100000;
    cursor: move;
    width: max-content;
    font-family: Georgia, serif;
    color: white;
    user-select: none;
    background: #0000;
    padding: 4px;
    border-radius: 8px;
}
#applicat-pane button {
    white-space: pre-wrap;
    appearance: none;
    border: 1px solid #444;
    border-radius: 8px;
    font-weight: bolder;
    background: #0007;
    backdrop-filter: blur(10px);
    cursor: pointer;
    overflow: hidden;
    text-align: left;
    font-family: Georgia, serif;
    display: grid;
    grid-auto-flow: row;
    grid-template-rows: 1fr;
    padding: 0;
    overflow: hidden;
    padding: 4px 4px 6px 6px;
    margin: 0;
    color: white;
    font-size: 14px;
    min-height: 50px;
    align-content: center;
    align-items: center;
}
#applicat-pane button span {
    width: 240px;
    text-overflow: ellipsis;
    overflow: hidden;
    text-wrap: nowrap;
}
#applicat-pane button:hover {
    background: #0bb;
    border-color: white;
    box-shadow: 0 0 16px 4px #0ffa;
}
#applicat-pane button:active {
    background: black;
    transform: scale(0.95);
}
#applicat-pane .top-button {
    display: grid;
    min-height: min-content;
    grid-auto-flow: column;
    align-items: center;
    gap: 5px;
    padding: 2px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: unset;
}
#applicat-pane .top-button span {
    width: unset;
}
#applicat-pane #grip {
    display: grid;
    justify-self: center;
    gap: 4px;
    grid-template-columns: 1fr 1fr 1fr;
    margin: 8px;
}
#applicat-pane #grip span {
    width: 6px;
    height: 6px;
    outline: 1px solid #444;
    border-radius: 4px;
    background: #0007;
    backdrop-filter: blur(10px);
}
#applicat-pane #close:hover {
    background: Crimson;
    box-shadow: 0 0 16px 4px #f00a;
}
#applicat-pane #close img {
    height: 16px;
}

.hover-hide {
    display: none;
}
button:hover .hover-hide {
    display: unset;
}
</style>


<div style="display: grid; grid-auto-flow: column; justify-content: space-between; width: 100%;">
    <button id="logo" title="Open Settings" class="top-button">
        <img src="${extensionAPI.runtime.getURL("icon.svg")}" draggable="false" style="height: 24px;" />
        <span>Applicat</span>
        <img src="${extensionAPI.runtime.getURL("settings.svg")}" draggable="false" style="height: 16px; margin-left: 2px;" class="hover-hide" />
    </button>

    <div id="grip" title="Drag panel">
        <span></span> <span></span> <span></span>
        <span></span> <span></span> <span></span>
    </div>

    <button id="close" title="Close Applicat Panel" class="top-button">
        <span>Close</span>
        <img src="${extensionAPI.runtime.getURL("x.svg")}" draggable="false" />
    </button>
</div>

`;

function createButtons( buttonMap, prompts ) {
    const aiButtonMap = [
        {
            label: "Cover Letter Prompt",
            getCopyText: () => formatPrompt( prompts.coverLetterPrompt, buttonMap ),
        },
        {
            label: "Answer Question Prompt",
            getCopyText: () => formatPrompt( prompts.answerQuestionPrompt, buttonMap ),
        },
    ];
    for( const { label, copyText, getCopyText } of [ ...aiButtonMap, ...buttonMap ] ) {
        const button = document.createElement( "button" );
        button.classList.add( "clone" );
        const buttonInnerHTML = 
            copyText
            ? `<span style="opacity: 0.7; font-weight: 400; font-size: 12px;"> ${label} </span><span> ${copyText ?? ""} </span>`
            : `<span> ${label} </span>`;
        button.innerHTML = buttonInnerHTML;
        button.onclick = async e => {
            copy( copyText || getCopyText() );
            button.textContent = "Copied!";
            await new Promise( resolve => setTimeout( resolve, 500 ) );
            button.innerHTML = buttonInnerHTML;
        }
        pane.appendChild( button );
    }
}


pane.querySelector( "#logo" ).onclick = () => extensionAPI.runtime.sendMessage( "options" );



let dragging, prevScreenX, prevScreenY;

function resetDragState() {
    dragging = false;
    [prevScreenX, prevScreenY ] = [ null, null ];
}

function dragPane( e ) {
    if( prevScreenX !== null && prevScreenY !== null ) {
        const [ movementX, movementY ] = [ e.screenX - prevScreenX, e.screenY - prevScreenY ];
        const top = parseFloat(pane.style.top || 0) + movementY + "px";
        const left = parseFloat(pane.style.left || 0) + movementX + "px";
        pane.style.top = top;
        pane.style.left = left;
        extensionAPI.storage.local.set({ applicatPaneTop: top, applicatPaneLeft: left });
    }
    [ prevScreenX, prevScreenY ] = [ e.screenX, e.screenY ];
}


pane.addEventListener( "pointerdown", () => dragging = true );
document.body.addEventListener( "pointerup", resetDragState );
document.body.addEventListener( "pointerleave", resetDragState );
document.body.addEventListener( "pointermove", e => dragging && dragPane( e ) );


( async () => {
    [ ...document.querySelectorAll( "#applicat-pane" ) ].forEach( elm => elm.remove() );
    const { showApplicatPane, applicatPaneTop, applicatPaneLeft, applicatButtonMap, applicatPrompts } =
        await extensionAPI.storage.local.get({
            showApplicatPane: true,
            applicatPaneTop: null,
            applicatPaneLeft: null,
            applicatButtonMap: [],
            applicatPrompts: {},
        });
    createButtons( applicatButtonMap, applicatPrompts );
    if( showApplicatPane ) document.body.appendChild( pane );
    pane.style.top = applicatPaneTop;
    pane.style.left = applicatPaneLeft;
} )();

extensionAPI.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if( request.showApplicatPane === true )
            document.body.appendChild( pane );
        if( request.showApplicatPane === false )
            pane.remove();
    }
);

pane.querySelector( "#close" ).addEventListener( "click", () =>
    pane.remove()
    + extensionAPI.storage.local.set({ showApplicatPane: false })
);



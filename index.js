//impot the ethers.js stuff
import { ethers } from "./ethers-5.2.esm.min.js";

// rename the solidity json file to .js and add 'export default' to the top line
import myEpicGame from './MyEpicGame.js';
// alternatively, 'import assertion' works in chrome, but it's not ready on firefox yet.

//bring in our contract address and that transform method
import {CONTRACT_ADDRESS, transformCharacterData, transformBossData} from "./utils.js";

//set up some global variables
var gameContract = null;
var characters = null;
var currentAccount = null;
var characterNFT = null;
var boss = null;

var shouldListenForAttack = true;
var shouldListenForHeals = true;
var shouldListenForMint = true;

//get some references to buttons we're gonna need
var resetButton = document.getElementById('reset-button');
var attackButton = document.getElementById('attack-button');

//this method will be the first to run, it logs a message and sets up listeners for the button clicks.
const isLoaded = () => {
    console.log('This is a vanillajs (plain old javascript) implementation of the nft-game-starter project.');
    document.getElementById('login-button').addEventListener('click', ()=>{connectWallet()});
    attackButton.addEventListener('click', ()=>{
        if(boss.hp > 0) runAttackAction();
    });    
    resetButton.addEventListener('click', ()=>{ResetHealth()});
}

//this just hides and shows divs as we need.
const showSection = (name, shouldShow = true) => {
    console.log('showing: %s', name);
    var sections = document.getElementsByClassName('section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.add('d-none');
    }

    var el = document.getElementById(name);
    shouldShow ? el.classList.remove('d-none') : el.classList.add('d-none');
}

//this is the callback for a minted nft.. 
const NftMinted = (address, tokenId, characterId)=> {
    if(shouldListenForMint){
        shouldListenForMint = false;
    }else{
        return;
    };

    hideSwal(); //I use SweetAlert2 for fancy pop-ups.. this just closes any open pop-up
    fetchNFTMeta();
    showSection('arena-section'); //shows the arena after a minting
}

//check for metamask and assign an account to currentAccount
const checkforWallet = async () => {
    try{
        const { ethereum } = window;

        if(!ethereum){
            console.log('Make sure you have metamask!');
            return;
        }else{
            console.log('We have the ethereum object!');
            if(currentAccount != null) return;

            const accounts = await ethereum.request({method: 'eth_accounts'});

            if(accounts.length !== 0){
                const account = accounts[0];
                console.log('Found an account: ', account);
                currentAccount = account;
            }else{
                console.log('No accounts found.');
            }
        }      
    } catch (error){
        console.log(error);
    }
};

//sets up the contract object and assigns callbacks
//also sees if the user has an NFT and assigns it to characterNFT
const fetchNFTMeta = async () => {
    console.log('Checking for NFT at address:', currentAccount);

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    gameContract = new ethers.Contract(CONTRACT_ADDRESS,myEpicGame.abi,signer);

    // listen to emit events
    gameContract.removeAllListeners();
    gameContract.on('NftMinted', NftMinted);
    gameContract.on('AttackComplete', AttackComplete);
    gameContract.on('ResetHealth', onResetHealth);

    const txn = await gameContract.getUserNFT();
    console.log(txn);

    if(txn.name){
        console.log('User has an NFT');
        characterNFT = transformCharacterData(txn);
        updatePlayerUi();
    }else{
        console.log('No NFT found');
    }
};  

//this gets the player div on the frontend and updates its values
const updatePlayerUi = () => {
    var el = document.getElementById('player-nft');
    var playerText = `${characterNFT.name} - <a target="new" href="https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${characterNFT.tokenId}">opensea</a>`;
    el.querySelector('.player-name').innerHTML = playerText;
    el.querySelector('.player-image').src = characterNFT.imageUri;        
    el.querySelector('.player-hp').innerText = `Health: ${characterNFT.hp}/${characterNFT.maxHp}`;
}

//this shows the login button div
const showLogin = () => {    
    showSection('login-section');
}

//this is the "login" part.. connects the wallet and assigns the currentAccount
const connectWallet = async () => {
    try{
      if(currentAccount != null) return;
      
      const {ethereum} = window;

      if(!ethereum){
        alert('GetMetamask');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('Connected', accounts[0]);
      currentAccount = accounts[0];
      runLogic();
    }catch(error){
      console.log(error);
    }
}

//this shows the battle div is we have a character and a boss
const showNFT = () => {
    showSection('arena-section');
}

//this shows the "choose your fighter" screen
const showMinter = () => {
    showSection('mint-section');
}

//this mints our chosen character
const mintCharacterNFTAction = async (characterId) =>  {
    try {
      if (gameContract) {
        shouldListenForMint = true;
        showSwal('Minting that badboy...');
        console.log(`Minting character ${characterId} in progress...`);
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);
      }
    } catch (error) {
      shouldListenForMint = false;
      console.warn('MintCharacterAction Error:', error);
      hideSwal();
    }
};

//this gets all available mintable characters
//and adds them to the divs
const getCharacters = async () => {
    try {
      console.log('Getting contract characters to mint');

      const charactersTxn = await gameContract.getAll();
      console.log('charactersTxn:', charactersTxn);

      characters = charactersTxn.map((characterData) =>
        transformCharacterData(characterData)
      );

      if(characters != null){
          var section = document.getElementById('mint-section');
          var template = document.getElementById('mint-template');
          characters.forEach((char, index) => {
            var el = template.cloneNode(true);
            el.querySelector('.character-name').innerText = char.name;
            el.querySelector('.character-image').src = char.imageUri;
            el.querySelector('.character-mint').addEventListener('click', ()=> {mintCharacterNFTAction(index)});
            el.querySelector('.character-mint').innerText = `Mint ${char.name}`;
            el.style.display = 'inline-block';
            section.appendChild(el);
          })
      }

    } catch (error) {
      console.error('Something went wrong fetching characters:', error);
    }
};

//this gets our boss character and updates his ui
const fetchBoss = async () => {
    const bossTxn = await gameContract.getBigBoss();
    console.log('Boss:', bossTxn);
    boss = transformBossData(bossTxn);
    updateBossUi();
};

//this does the boss ui updating 
const updateBossUi = () => {
    var el = document.getElementById('boss-nft');
    el.querySelector('.boss-name').innerText = boss.name;
    el.querySelector('.boss-image').src = boss.imageUri;
    el.querySelector('.boss-hp').innerText = `Health: ${boss.hp}/${boss.maxHp}`;    
    showButtons();
}

//here we call our attack method
const runAttackAction = async () => {
    try {
      if (gameContract) {
        shouldListenForAttack = true;
        showSwal('Attacking that sumbich!');  
        console.log('Attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);          
      }
    } catch (error) {
      shouldListenForAttack = false;
      console.error('Error attacking boss:', error);
      hideSwal();
    }    
};

//this is the callback for the attack
const AttackComplete = (newBossHp, newPlayerHp) => {
    if(shouldListenForAttack){
        shouldListenForAttack = false;
    }else{
        return;
    };

    hideSwal();
    const bossHp = newBossHp.toNumber();
    const playerHp = newPlayerHp.toNumber();

    Swal.fire(
        'Good job!',
        `AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`,
        'success'
      )
    console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

    boss.hp = bossHp;
    characterNFT.hp = playerHp;
    
    updateBossUi();
    updatePlayerUi();
};

//this determines which button should be shown.. attack, or reset if the boss dies
const showButtons = () => {
    console.log(boss);
    if(boss.hp == 0){
        attackButton.classList.add('d-none');
        resetButton.classList.remove('d-none');
        document.getElementById('win-h1').classList.remove('d-none');
    }else{
        attackButton.classList.remove('d-none');
        resetButton.classList.add('d-none');
        document.getElementById('win-h1').classList.add('d-none');        
    };
}

//this calls a method I made which restore the player and boss health
const ResetHealth = async () => {
    try{
        shouldListenForHeals = true;
        const txn = await gameContract.resetHealth();
        console.log('Resetting Health:', txn);
        showSwal('Resetting Health...');
    }catch (error){
        shouldListenForHeals = false;
        hideSwal();
        console.log(error);
    }
};

//this is a callback for when the health is restored
const onResetHealth = (newBossHp, newPlayerHp) => {
    if(shouldListenForHeals){
        shouldListenForHeals = false;
    }else{
        return;
    };

    hideSwal();
    const bossHp = newBossHp.toNumber();
    const playerHp = newPlayerHp.toNumber();
    boss.hp = bossHp;
    characterNFT.hp = playerHp;

    updatePlayerUi();
    updateBossUi();
    
    console.log(`Healths reset.. ${newBossHp} and ${newPlayerHp}`);
    resetButton.classList.add('d-none');
    attackButton.classList.remove('d-none');
    document.getElementById('win-h1').classList.add('d-none');        
};

//the main logic
const runLogic = () => {
    checkforWallet().then(()=>{
        showSwal('loading..');

        //if not authenticated, show login button
        if(currentAccount == null) showLogin();
        
        //if authenticated, check for existing NFT and..
        if(currentAccount != null) fetchNFTMeta().then(()=> { 
            //exit if error with contract
            if(gameContract == null) return;

            //get all the NFT characters
            if(gameContract != null){ 
                if(characters == null) getCharacters();
                if(boss == null) fetchBoss(); 
            }; 

            //If no character minted, show mint screen
            if(characterNFT == null){ showMinter() };

            //If character exists, show fight arena
            if(characterNFT != null){ showNFT() }; 
        });

        hideSwal();
    });     
}

//this is how we call SweetAlert2
const showSwal = (msg) => {
    Swal.fire({
        title: msg,
        imageUrl: 'loading.gif',
                imageWidth: 384,
                imageHeight: 215,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false
      })    
}

//this closes SweetAlert pop-ups
const hideSwal = () => {
    Swal.close();
}

//do this when the page loads
document.addEventListener("DOMContentLoaded", function() {
    //say hello
    isLoaded();

    //check for metamask
    runLogic();
});
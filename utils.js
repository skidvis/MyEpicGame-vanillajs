const CONTRACT_ADDRESS = '0x980D4435a72E1aCB108dBB93dB7e42d9bBDB2d5d';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageUri: characterData.imageUri,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData };
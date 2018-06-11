let bNumber;
module.exports = (gasUsage) => (res) => {
  if (res.includes('Block Number: ')) {
    bNumber= res.split('Block Number: ')[1];
  } else if (res.includes('Gas usage: ')) {
    const g = res.split('Gas usage: ')[1];
    gasUsage[bNumber] = g;
  } else if (res.includes('Runtime Error: ')) {
    // need to subtract 1 b/c gas gets printed before block number, so we are always 1 block behind
    delete gasUsage[bNumber - 1];
  }
}
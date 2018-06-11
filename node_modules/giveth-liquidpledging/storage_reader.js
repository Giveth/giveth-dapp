const baseLP = await contracts.LiquidPledgingMock.new(web3, escapeHatchDestination, { gas: 6700000 });
lpFactory = await contracts.LPFactory.new(web3, '0xaDfd58C4043fd09336a2e69D69C237D7c7cBFE33', baseLP.$address);

const r = await lpFactory.newLP(accounts[0], escapeHatchDestination);

const vaultAddress = r.events.DeployVault.returnValues.vault;
vault = new contracts.LPVault(web3, vaultAddress);

const lpAddress = r.events.DeployLiquidPledging.returnValues.liquidPledging;
liquidPledging = new contracts.LiquidPledgingMock(web3, lpAddress);

liquidPledgingState = new LiquidPledgingState(liquidPledging);

// set permissions
const kernel = new contracts.Kernel(web3, await liquidPledging.kernel());

// new addy 0x4E5d1Bde69f55f689e8f59b8a5fe9bA388538A77
// old addy 0x36b70A995ddbe285E331149C4DBB0e74B06699F0


var fs = require('fs');
var contracts = require('./build/contracts.js');

var lp = new contracts.LiquidPledging(web3, '0x93C5D1D7265d6595c7aA21AB1a3e6D6Ac6216CC9') // TODO: update address location

var f = JSON.parse(fs.readFileSync('./build/solcStandardOutput.json').toString());

var defs = Object.values(f.sources).reduce((val, s) => {
    return val.concat(
        s.ast.nodes.filter(n => n.nodeType === 'ContractDefinition')
    );
}, [])

ast = defs.find(d => d.name === 'LiquidPledging');
deps = ast.linearizedBaseContracts.map(id => defs.find(d => d.id == id))

deps.forEach(d => { if (d) console.log(d.name, d.id) })
deps.reverse();

var stateVariables = deps.reduce((val, d) => {
    // what to do about constants ??? exclude them b/c they aren't in storage
    return val.concat(
        d.nodes.filter(n => n.nodeType === 'VariableDeclaration' && n.stateVariable === true && !n.constant)
            .map(n => Object.assign({}, n.typeName, {
                contractName: d.name,
                constant: n.constant,
                name: n.name,
                type: n.typeName.name
            }))
    )
}, [])

var unitBytes = {
    bool: 1,
    uint: 32,
    int: 32,
    fixed: 32,
    ufixed: 32,
    address: 20,
    byte: 1,
    enum: 1 // TODO: may need to lookup the length of the enum itself, to determine how many bytes it will take up. 256 long enum will take up 2 bytes?
}

for (s = 8; s <= 256; s += 8) {
    unitBytes[`int${s}`] = s / 8;
    unitBytes[`uint${s}`] = s / 8;
    unitBytes[`ufixed${s}`] = s / 8;
    unitBytes[`fixed${s}`] = s / 8;
}

for (s = 1; s <= 32; s++) {
    unitBytes[`bytes${s}`] = s;
}

let unpack = (val, offset, i) => {
    let packed;
    const v = stateVariables[i];
    const b = v.nodeType === 'UserDefinedTypeName' ? 20 : unitBytes[v.type];
    if (offset > 0) {
        packed = offset + b <= 32;
    } else {
        // look ahead
        const nextV = stateVariables[i + 1];
        let nextB = 0;
        if (nextV) {
            if (nextV.nodeType === 'UserDefinedTypeName') {
                nextB = 20; // TODO: is this always an address? could be an enum ???
            } else {
                nextB = unitBytes[nextV.type] || 0;
            }
        }
        packed = nextB && b + nextB <= 32;
    }

    // console.log(val, offset, b);
    if (packed) {
        const start = -((offset + b) * 2)
        const end = -(offset * 2) || -1
        const uVal = (offset === 0) ? `0x${val.slice(start)}` : `0x${val.slice(start, end)}`;
        return {
            val: uVal,
            offset: offset + b >= 32 ? 0 : offset + b,
            packed: true
        };
    }
    return {
        val,
        offset: 0,
        packed: false
    };
}

var i = 0;
var printStorage = async () => {
    var offset = 0;
    for (var x = 0; x < stateVariables.length; x++) {
        v = stateVariables[x];
        switch (v.nodeType) {
            case 'ElementaryTypeName':
                val = await web3.eth.getStorageAt(lp.$address, i);

                uVal = unpack(val, offset, x);
                // console.log(uVal);

                console.log(`${v.contractName}.${v.name}`, '=>', uVal.val, '=> slot', i);
                if (!uVal.packed) i++;
                offset = uVal.offset;
                break;
            case 'Mapping':
                val = await web3.eth.getStorageAt(lp.$address, i);
                console.log(`${v.contractName}.${v.name}`, '=>', v.typeDescriptions.typeString, '=> length', val, '=> slot', i);
                i++;
                offset = 0;
                break;
            case 'UserDefinedTypeName':
                val = await web3.eth.getStorageAt(lp.$address, i);
                uVal = unpack(val, offset, x);
                // console.log(uVal);
                console.log(`${v.contractName}.${v.name}`, '=>', v.typeDescriptions.typeString, '=>', uVal.val, '=> slot', i);
                if (!uVal.packed) i++;
                offset = uVal.offset;
                break;
            case 'ArrayTypeName':
                if (v.length) {
                    // console.log('length.val', v.length.value, v);
                    var l = Number(v.length.value);
                    console.log(`${v.contractName}.${v.name}`, '=> static array => length', l, '=> slot', i);
                    i += l;
                    // i++; // not sure if this is correct ???
                } else {
                    val = await web3.eth.getStorageAt(lp.$address, i);
                    console.log(`${v.contractName}.${v.name}`, '=> dynamic array => length', val, '=> slot', i);
                    i++;
                }
                offset = 0;
                break;
            default:
                throw new Error('unknown nodeType:', v.nodeType, v);
        }
    }
}
var x = printStorage();

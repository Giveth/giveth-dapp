#! /bin/bash

curl -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","id":12345,"method":"eth_getLogs","params":[{"topics":["0x938d1829fcab93f0fd93ce45aa5dca72622d1d3ff8fcc306eff35db4dc579f29", null, "0x000000000000000000000000702e6775f573f820a8abe54fe69474da69223b36"],"address":"0x01c9f860fc7894180c36ccb4ed0b7ae32d5c4a23","fromBlock":"0x19936c","toBlock":"0x1993f6"}]}' https://morden.infura.io

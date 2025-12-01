local mem = {}

mem.ADDR_PARTY_COUNT = 0x02024280
mem.ADDR_PARTY_BASE  = 0x02024284
mem.PKMN_SIZE        = 100

mem.ADDR_MAP_ID      = 0x02036DFC
mem.ADDR_BADGES      = 0x02026CB8

function mem.readWord(addr)  return memory.readword(addr) end
function mem.readByte(addr)  return memory.readbyte(addr) end
function mem.readDWord(addr) return memory.readdword(addr) end

return mem

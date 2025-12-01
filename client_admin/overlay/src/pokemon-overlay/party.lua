local mem = dofile("memory.lua")

local party = {}

local natureNames = {
    "Hardy","Lonely","Brave","Adamant","Naughty",
    "Bold","Docile","Relaxed","Impish","Lax",
    "Timid","Hasty","Jolly","Naive","Modest",
    "Mild","Quiet","Bashful","Rash","Calm",
    "Gentle","Sassy","Careful","Quirky"
}

local function getNature(pid)
    return natureNames[(pid % 25) + 1]
end

local function isShiny(pid, tid, sid)
    local s = bit.bxor(bit.band(pid, 0xFFFF), bit.rshift(pid,16), tid, sid)
    return s < 8
end

local function readNickname(base)
    local name = ""
    for i=0,9 do
        local c = memory.readbyte(base + 0x48 + i)
        if c > 0 then name = name .. string.char(c) end
    end
    return name
end

local function readIVs(base)
    local word = mem.readDWord(base + 0x74)
    return {
        hp  = bit.band(word, 0x1F),
        atk = bit.band(bit.rshift(word, 5), 0x1F),
        def = bit.band(bit.rshift(word,10), 0x11F),
        spa = bit.band(bit.rshift(word,15), 0x1F),
        spd = bit.band(bit.rshift(word,20), 0x1F),
        spe = bit.band(bit.rshift(word,25), 0x1F),
    }
end

local function readMoves(base)
    return {
        mem.readWord(base + 0x2C),
        mem.readWord(base + 0x2E),
        mem.readWord(base + 0x30),
        mem.readWord(base + 0x32),
    }
end

function party.readOne(index)
    local base = mem.ADDR_PARTY_BASE + (index * mem.PKMN_SIZE)
    local speciesId = mem.readWord(base + 0x08)
    if speciesId == 0 then return nil end

    local pid = mem.readDWord(base + 0x00)
    local tid = mem.readWord(0x02020000)
    local sid = mem.readWord(0x02020002)

    local level = mem.readByte(base + 0x8C)
    local hp    = mem.readWord(base + 0x84)
    local maxhp = mem.readWord(base + 0x88)

    return {
        speciesId = speciesId,
        nickname = readNickname(base),
        level = level,
        nature = getNature(pid),
        shiny = isShiny(pid,tid,sid),
        hp = hp,
        maxhp = maxhp,
        ivs = readIVs(base),
        moves = readMoves(base),
        pid = pid
    }
end

function party.readAll()
    local count = mem.readByte(mem.ADDR_PARTY_COUNT)
    local out = {}

    for i=0,count-1 do
        local mon = party.readOne(i)
        if mon then table.insert(out, mon) end
    end

    return out
end

return party

local json   = dofile("json.lua")
local party  = dofile("party.lua")
local mem    = dofile("memory.lua")
local events = dofile("events.lua")


local writer = {}

function writer.writeLive()
    local data = {
        timestamp = os.time(),
        badges = mem.readByte(mem.ADDR_BADGES),
        location = mem.readWord(mem.ADDR_MAP_ID),
        team = party.readAll(),
        events = events.list
    }

    local f = io.open("live.json","w")
    if f then
        f:write(json.encode(data))
        f:close()
    end
end

return writer

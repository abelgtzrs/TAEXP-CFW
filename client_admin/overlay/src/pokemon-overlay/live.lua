json   = dofile("json.lua")
party  = dofile("party.lua")
events = dofile("events.lua")
writer = dofile("writer.lua")


local lastUpdate = os.time()

while true do
    emu.frameadvance()

    local now = os.time()
    if now ~= lastUpdate then
        writer.writeLive()
        lastUpdate = now
    end
end

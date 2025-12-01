local events = {}
events.list = {}

function events.push(msg)
    table.insert(events.list, 1, msg)
    if #events.list > 5 then
        table.remove(events.list)
    end
end

return events

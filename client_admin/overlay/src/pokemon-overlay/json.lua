local json = {}

local function escape_str(s)
    s = s:gsub("\\", "\\\\")
         :gsub("\"", "\\\"")
         :gsub("\n", "\\n")
    return s
end

function json.encode(val)
    local t = type(val)

    if t == "nil" then
        return "null"
    elseif t == "number" or t == "boolean" then
        return tostring(val)
    elseif t == "string" then
        return '"' .. escape_str(val) .. '"'
    elseif t == "table" then
        local isArray = (#val > 0)
        local out = {}

        if isArray then
            for i = 1, #val do
                table.insert(out, json.encode(val[i]))
            end
            return "[" .. table.concat(out, ",") .. "]"
        else
            for k, v in pairs(val) do
                table.insert(out, '"' .. k .. '":' .. json.encode(v))
            end
            return "{" .. table.concat(out, ",") .. "}"
        end
    end
end

return json

-- Return unique logins that have at least one non-expired session metadata key.
-- The SCAN loop runs inside Redis so the read is one atomic script operation.
local cursor = '0'
local active_logins = {}
local pattern = ARGV[1]
local count = tonumber(ARGV[2]) or 100

repeat
  local page = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', count)
  cursor = page[1]

  for _, key in ipairs(page[2]) do
    local login = redis.call('GET', key)
    if login then
      active_logins[login] = true
    end
  end
until cursor == '0'

local result = {}
for login in pairs(active_logins) do
  table.insert(result, login)
end

table.sort(result)
return result

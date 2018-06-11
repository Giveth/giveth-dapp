res = File.read('./ruby_output')
res2 = `./getLogs4.sh`

puts res2
File.write('./ruby_output', res2)
puts "comparing #{res} to #{res2}\n"

while res == res2 do
  puts 'same old, trying again.'
  res2 = `./getLogs4.sh`
  puts res2
  sleep 60
end

puts 'new response found!!!'
puts res2
`say "Work complete"`

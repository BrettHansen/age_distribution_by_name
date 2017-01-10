import json

# prop_alive describes the expected proportion of people born
# in year x that will be alive today (2015). It is dict of the
# form prop_alive[1949] = 0.67
prop_alive = {}
with open("actuarial_table.csv") as file:
	for line in file:
		tokens = line.strip().split(",")
		prop_alive[tokens[0]] = {}
		prop_alive[tokens[0]]["M"] = float(tokens[1])
		prop_alive[tokens[0]]["F"] = float(tokens[2])

# birth_rate.csv is the most accurate measure of all people born in
# in the US in a given year. After 1942, it is very close to the
# total people born according to the SSA name data.
birth_rate = {}
with open("birth_rate.csv") as file:
	for line in file:
		tokens = line.strip().split(",")
		birth_rate[int(tokens[0])] = int(tokens[1])

# birth_totals.csv describes the total number of people born in a
# given year according to the SSA name data. It will be adjusted
# using the birth_rate dict.
adjustment = {}
with open("birth_totals.csv") as file:
	for line in file:
		tokens = line.strip().split(",")
		adjustment[int(tokens[0])] = birth_rate[int(tokens[0])] / float(int(tokens[1]) + int(tokens[2]))

all_names = {}
current_letter = ""

# names.csv is the SSA name data in a table where the columns
# are the years 1880-2015, the rows are each name, separated by
# sex, and each cell represents the number of people the SSA has
# on record as being born that year, with that name and sex.
with open("names.csv") as file:
	file.readline() # throw away header
	for line in file:
		tokens = line.strip().split(",")
		name = tokens[0]
		sex = tokens[1]

		if name not in all_names:
			all_names[name] = {}

		# yearly_births will represent the projected number of pople born with
		# the current name and sex in a given year adjusted using the more
		# accurate birth rate numbers. distribution uses yearly_births to project
		# how many of these people born in a given year are still alive (in 2015)
		yearly_births = [int(tokens[i]) * adjustment[i + 1880 - 2] for i in range(2, len(tokens))]
		distribution = [int(prop_alive[str(rel_year + 1880)][sex] * yearly_births[rel_year]) for rel_year in range(0, len(yearly_births))]

		all_names[name][sex] = distribution
		if current_letter != name[0]:
			current_letter = name[0]
			print current_letter

data = {}
for name in sorted(all_names.keys()):
	char = name[0].upper()
	if char not in data:
		data[char] = {}
	data[char][name.upper()] = {}
	if "M" in all_names[name]:
		data[char][name.upper()]["M"] = all_names[name]["M"]
	if "F" in all_names[name]:
		data[char][name.upper()]["F"] = all_names[name]["F"]

for char in data:
	with open("../detailed_data/" + char + ".json", "wb") as outfile:
		json.dump(data[char], outfile)
	
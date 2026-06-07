export function getCarName(ordinal: number): string {
  const cars: { [key: number]: string } = {
    3195: "2021 Porsche 911 GT3",
    3012: "2018 Bugatti Chiron",
    3111: "2018 Ferrari FXX-K Evo",
    3443: "2020 Toyota GR Supra",
    1234: "2020 Chevrolet Corvette Stingray",
    1111: "2018 Ford Mustang GT",
    2561: "2019 Subaru WRX STI",
    1214: "2016 Mazda MX-5",
    999: "Toyota Supra RZ",
  };
  return cars[ordinal] || `Car #${ordinal}`;
}

export function getCarClassLabel(classId: number): string {
  // Between 0 (D -- worst cars) and 6 (X class -- best cars) inclusive
  const classes = ["D", "C", "B", "A", "S1", "S2", "X"];
  return classes[classId] || `PI ${classId}`;
}

export function getCarClassColorClass(classId: number): string {
  const classes = ["d", "c", "b", "a", "s1", "s2", "x"];
  const cls = classes[classId] || "d";
  return `class-${cls}`;
}

export function getDrivetrainTypeLabel(typeId: number): string {
  // 0 = FWD, 1 = RWD, 2 = AWD
  const types = ["FWD", "RWD", "AWD"];
  return types[typeId] || "AWD";
}

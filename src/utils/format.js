const padStringToLength = (string, length) => {
  let output = `${string}`;

  while (output.length < length) {
    output = `${output} `;
  }

  return output;
};

const formatNumberToLength = (number, length) => {
  let output = `${number}`;

  if (number < 1000) {
    // NO-OP
  } else if (number < 1000000) {
    const thousands = Math.floor(number / 1000) % 1000;
    const hundreds = Math.floor(number / 1) % 1000;

    output = `${thousands},${hundreds}`;

    if (output.length > length) {
      const precision2 = Math.floor(hundreds / 10);
      output = `${thousands}.${precision2} K`;

      if (output.length > length) {
        const precision1 = Math.floor(hundreds / 100);
        output = `${thousands}.${precision1} K`;

        if (output.length > length) {
          output = `${thousands} K`;
        }
      }
    }
  } else if (number < 1000000000) {
    const millions = Math.floor(number / 1000000) % 1000;
    const thousands = Math.floor(number / 1000) % 1000;
    const hundreds = Math.floor(number / 1) % 1000;

    output = `${millions},${thousands},${hundreds}`;

    if (output.length > length) {
      const precision5 = Math.floor(hundreds / 10);
      output = `${millions}.${thousands}${precision5} M`;

      if (output.length > length) {
        const precision4 = Math.floor(hundreds / 100);
        output = `${millions}.${thousands}${precision4} M`;

        if (output.length > length) {
          const precision3 = thousands;
          output = `${millions}.${precision3} M`;

          if (output.length > length) {
            const precision2 = Math.floor(thousands / 10);
            output = `${millions}.${precision2} M`;

            if (output.length > length) {
              const precision1 = Math.floor(thousands / 100);
              output = `${millions}.${precision1} M`;

              if (output.length > length) {
                output = `${millions} M`;
              }
            }
          }
        }
      }
    }
  } else if (number < 1000000000000) {
    const billions = Math.floor(number / 1000000000) % 1000;
    const millions = Math.floor(number / 1000000) % 1000;
    const thousands = Math.floor(number / 1000) % 1000;
    const hundreds = Math.floor(number / 1) % 1000;

    output = `${billions},${millions},${thousands},${hundreds}`;

    if (output.length > length) {
      const precision8 = Math.floor(hundreds / 10);
      output = `${billions}.${millions}${thousands}${precision8} B`;

      if (output.length > length) {
        const precision7 = Math.floor(hundreds / 100);
        output = `${billions}.${millions}${thousands}${precision7} B`;

        if (output.length > length) {
          const precision6 = thousands;
          output = `${billions}.${millions}${precision6} B`;

          if (output.length > length) {
            const precision5 = Math.floor(thousands / 10);
            output = `${billions}.${millions}${precision5} B`;

            if (output.length > length) {
              const precision4 = Math.floor(thousands / 100);
              output = `${billions}.${millions}${precision4} B`;

              if (output.length > length) {
                const precision3 = millions;
                output = `${billions}.${precision3} B`;

                if (output.length > length) {
                  const precision2 = Math.floor(millions / 10);
                  output = `${billions}.${precision2} B`;

                  if (output.length > length) {
                    const precision1 = Math.floor(millions / 100);
                    output = `${billions}.${precision1} B`;

                    if (output.length > length) {
                      output = `${billions} B`;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } else {
    const trillions = Math.floor(number / 1000000000000) % 1000;
    const billions = Math.floor(number / 1000000000) % 1000;
    const millions = Math.floor(number / 1000000) % 1000;
    const thousands = Math.floor(number / 1000) % 1000;
    const hundreds = Math.floor(number / 1) % 1000;

    output = `${trillions},${billions},${millions},${thousands},${hundreds}`;

    if (output.length > length) {
      const precision11 = Math.floor(hundreds / 10);
      output = `${trillions}.${billions}${millions}${thousands}${precision11} T`;

      if (output.length > length) {
        const precision10 = Math.floor(hundreds / 100);
        output = `${trillions}.${billions}${millions}${thousands}${precision10} T`;

        if (output.length > length) {
          const precision9 = thousands;
          output = `${trillions}.${billions}${millions}${precision9} T`;

          if (output.length > length) {
            const precision8 = Math.floor(thousands / 10);
            output = `${trillions}.${billions}${millions}${precision8} T`;

            if (output.length > length) {
              const precision7 = Math.floor(thousands / 100);
              output = `${trillions}.${billions}${millions}${precision7} T`;

              if (output.length > length) {
                const precision6 = millions;
                output = `${trillions}.${billions}${precision6} T`;

                if (output.length > length) {
                  const precision5 = Math.floor(millions / 10);
                  output = `${trillions}.${billions}${precision5} T`;

                  if (output.length > length) {
                    const precision4 = Math.floor(millions / 100);
                    output = `${trillions}.${billions}${precision4} T`;

                    if (output.length > length) {
                      const precision3 = billions;
                      output = `${trillions}.${precision3} T`;

                      if (output.length > length) {
                        const precision2 = Math.floor(billions / 10);
                        output = `${trillions}.${precision2} T`;

                        if (output.length > length) {
                          const precision1 = Math.floor(billions / 100);
                          output = `${trillions}.${precision1} T`;

                          if (output.length > length) {
                            output = `${trillions} T`;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  while (output.length < length) {
    output = ` ${output}`;
  }

  return output;
};

module.exports = {
  padStringToLength,
  formatNumberToLength,
};

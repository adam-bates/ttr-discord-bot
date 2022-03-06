const padStringToLength = (string, length) => {
  let output = `${string}`;

  while (output.length < length) {
    output = `${output} `;
  }

  return output;
};

const padNumberWithZero = (number, length) => {
  let output = `${number}`;

  while (output.length < length) {
    output = `0${output}`;
  }

  return output;
};

const formatNumberToLength = (number, length) => {
  let output = `${number}`;

  if (number < 1000) {
    if (output.length > length && output.includes(".")) {
      output = output.slice(0, length);
    }
  } else if (number < 1000000) {
    const thousands = Math.floor(number / 1000) % 1000;
    const hundreds = Math.floor(number / 1) % 1000;

    output = `${thousands},${padNumberWithZero(hundreds, 3)}`;

    if (output.length > length) {
      const precision2 = padNumberWithZero(Math.floor(hundreds / 10), 3);
      output = `${thousands}.${precision2} K`;

      if (output.length > length) {
        const precision1 = padNumberWithZero(Math.floor(hundreds / 100), 3);
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

    output = `${millions},${padNumberWithZero(
      thousands,
      3
    )},${padNumberWithZero(hundreds, 3)}`;

    if (output.length > length) {
      const precision5 = padNumberWithZero(Math.floor(hundreds / 10), 3);
      output = `${millions}.${padNumberWithZero(thousands, 3)}${precision5} M`;

      if (output.length > length) {
        const precision4 = padNumberWithZero(Math.floor(hundreds / 100), 3);
        output = `${millions}.${padNumberWithZero(
          thousands,
          3
        )}${precision4} M`;

        if (output.length > length) {
          const precision3 = padNumberWithZero(thousands, 3);
          output = `${millions}.${precision3} M`;

          if (output.length > length) {
            const precision2 = padNumberWithZero(Math.floor(thousands / 10), 3);
            output = `${millions}.${precision2} M`;

            if (output.length > length) {
              const precision1 = padNumberWithZero(
                Math.floor(thousands / 100),
                3
              );
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

    output = `${billions},${padNumberWithZero(millions, 3)},${padNumberWithZero(
      thousands,
      3
    )},${padNumberWithZero(hundreds, 3)}`;

    if (output.length > length) {
      const precision8 = padNumberWithZero(Math.floor(hundreds / 10), 3);
      output = `${billions}.${padNumberWithZero(
        millions,
        3
      )}${padNumberWithZero(thousands, 3)}${precision8} B`;

      if (output.length > length) {
        const precision7 = padNumberWithZero(Math.floor(hundreds / 100), 3);
        output = `${billions}.${padNumberWithZero(
          millions,
          3
        )}${padNumberWithZero(thousands, 3)}${precision7} B`;

        if (output.length > length) {
          const precision6 = padNumberWithZero(thousands, 3);
          output = `${billions}.${padNumberWithZero(
            millions,
            3
          )}${precision6} B`;

          if (output.length > length) {
            const precision5 = padNumberWithZero(Math.floor(thousands / 10), 3);
            output = `${billions}.${padNumberWithZero(
              millions,
              3
            )}${precision5} B`;

            if (output.length > length) {
              const precision4 = padNumberWithZero(
                Math.floor(thousands / 100),
                3
              );
              output = `${billions}.${padNumberWithZero(
                millions,
                3
              )}${precision4} B`;

              if (output.length > length) {
                const precision3 = padNumberWithZero(millions, 3);
                output = `${billions}.${precision3} B`;

                if (output.length > length) {
                  const precision2 = padNumberWithZero(
                    Math.floor(millions / 10),
                    3
                  );
                  output = `${billions}.${precision2} B`;

                  if (output.length > length) {
                    const precision1 = padNumberWithZero(
                      Math.floor(millions / 100),
                      3
                    );
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

    output = `${trillions},${padNumberWithZero(
      billions,
      3
    )},${padNumberWithZero(millions, 3)},${padNumberWithZero(
      thousands,
      3
    )},${padNumberWithZero(hundreds, 3)}`;

    if (output.length > length) {
      const precision11 = padNumberWithZero(Math.floor(hundreds / 10), 3);
      output = `${trillions}.${padNumberWithZero(
        billions,
        3
      )}${padNumberWithZero(millions, 3)}${padNumberWithZero(
        thousands,
        3
      )}${precision11} T`;

      if (output.length > length) {
        const precision10 = padNumberWithZero(Math.floor(hundreds / 100), 3);
        output = `${trillions}.${padNumberWithZero(
          billions,
          3
        )}${padNumberWithZero(millions, 3)}${padNumberWithZero(
          thousands,
          3
        )}${precision10} T`;

        if (output.length > length) {
          const precision9 = padNumberWithZero(thousands, 3);
          output = `${trillions}.${padNumberWithZero(
            billions,
            3
          )}${padNumberWithZero(millions, 3)}${padNumberWithZero(
            precision9,
            3
          )} T`;

          if (output.length > length) {
            const precision8 = padNumberWithZero(Math.floor(thousands / 10), 3);
            output = `${trillions}.${padNumberWithZero(
              billions,
              3
            )}${padNumberWithZero(millions, 3)}${padNumberWithZero(
              precision8,
              3
            )} T`;

            if (output.length > length) {
              const precision7 = padNumberWithZero(
                Math.floor(thousands / 100),
                3
              );
              output = `${trillions}.${padNumberWithZero(
                billions,
                3
              )}${padNumberWithZero(millions, 3)}${precision7} T`;

              if (output.length > length) {
                const precision6 = padNumberWithZero(millions, 3);
                output = `${trillions}.${padNumberWithZero(
                  billions,
                  3
                )}${precision6} T`;

                if (output.length > length) {
                  const precision5 = padNumberWithZero(
                    Math.floor(millions / 10),
                    3
                  );
                  output = `${trillions}.${padNumberWithZero(
                    billions,
                    3
                  )}${precision5} T`;

                  if (output.length > length) {
                    const precision4 = padNumberWithZero(
                      Math.floor(millions / 100),
                      3
                    );
                    output = `${trillions}.${padNumberWithZero(
                      billions,
                      3
                    )}${precision4} T`;

                    if (output.length > length) {
                      const precision3 = padNumberWithZero(billions, 3);
                      output = `${trillions}.${precision3} T`;

                      if (output.length > length) {
                        const precision2 = padNumberWithZero(
                          Math.floor(billions / 10),
                          3
                        );
                        output = `${trillions}.${precision2} T`;

                        if (output.length > length) {
                          const precision1 = padNumberWithZero(
                            Math.floor(billions / 100),
                            3
                          );
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

const capitalizeFirst = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

module.exports = {
  padStringToLength,
  formatNumberToLength,
  capitalizeFirst,
};

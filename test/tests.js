test("clearRegisters()", function() {
    ROM = [0];
    Chip8.initialize(ROM);
    Chip8.v[0] = 2;
    Chip8.clearRegisters();
    equal(Chip8.v[0], 0, "Reset registers after setting them");
});
test("clearMemory()", function() {
    ROM = [0];
    Chip8.initialize(ROM);
    Chip8.memory[0xFF] = 255;
    Chip8.clearMemory();
    equal(Chip8.memory[0xFF], 0, "Clear memory after setting it");
});
test("clearStack()", function() {
    ROM = [0];
    Chip8.initialize(ROM);
    Chip8.stack[2] = 0xFFF;
    Chip8.clearStack();
    equal(Chip8.stack[2], 0, "Clear the stack after setting it");
});
test("clearTimers()", function() {
    ROM = [0];
    Chip8.initialize(ROM);
    Chip8.soundTimer = 2;
    Chip8.delayTimer = 2;
    Chip8.clearTimers();
    equal(Chip8.soundTimer, 0, "Reset sound timer after setting it");
    equal(Chip8.delayTimer, 0, "Reset delay timer after setting it");
});

test("Check font set: A", function() {
    ROM = [0];
    Chip8.initialize(ROM);
    equal(Chip8.fontset[50], 0x0F0, "Check 1 fontset");
    equal(Chip8.fontset[51], 0x090, "Check 2 fontset");
    equal(Chip8.fontset[52], 0x0F0, "Check 3 fontset");
    equal(Chip8.fontset[53], 0x090, "Check 5 fontset");
    equal(Chip8.fontset[54], 0x090, "Check 6 fontset");
});
test("0x00E0", function() {
    Chip8.initialize(['0x00','0xE0']);
    Chip8.decodeOpcode();
    equal(Chip8.drawFlag,true,"Set drawflag after clear screen"); 
});
test("0x00EE", function() {
    Chip8.initialize(['0x00','0xEE']);
    Chip8.sp = 1;
    Chip8.stack[0] = 2; 
    Chip8.decodeOpcode();
    equal(Chip8.pc,4,"Return from a subroutine"); 
});
test("0x1NNN", function() {
    Chip8.initialize(['0x11','0x20']);
    Chip8.decodeOpcode();
    equal(Chip8.pc,288,"Jump to a new address");
});
test("0x2NNN", function() {
    Chip8.initialize(['0x21','0x22']);
    Chip8.decodeOpcode();
    equal(Chip8.pc,290,"Jump to a new address");
    equal(Chip8.stack[Chip8.sp - 1],512,"Check saved pc in stack");
});
test("0x3XNN", function() {
    Chip8.initialize(['0x31','0x20']);
    Chip8.v[1]= 32;
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip as VX == NN");
});
test("0x4XNN", function() {
    Chip8.initialize(['0x41','0x21']);
    Chip8.v[1]= 32;
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip as VX != NN");
});
test("0x5XYO", function() {
    Chip8.initialize(['0x51','0x20']);
    Chip8.v[1]= 32;
    Chip8.v[2]= 32;
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip as VX == VY");
});
test("0x6XNN", function() {
    Chip8.initialize(['0x61','0x20']);
    Chip8.decodeOpcode();
    equal(Chip8.v[1],32,"Set VX to NN");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x7XNN", function() {
    Chip8.initialize(['0x71','0x20']);
    Chip8.v[1] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.v[1],64,"Add NN to VX"); 
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY0", function() {
    Chip8.initialize(['0x81','0x20']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 34,"Set VX to VY");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY1", function() {
    Chip8.initialize(['0x81','0x21']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 34,"Set VX to VX or VY");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY2", function() {
    Chip8.initialize(['0x81','0x22']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 32,"Set VX to VX and VY");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY3", function() {
    Chip8.initialize(['0x81','0x23']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.FAIL, false,"Missing test");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY4", function() {
    Chip8.initialize(['0x81','0x24']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 66,"Add VY to VX");
    equal(Chip8.v[0xF], 0, "Set carry bit");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY4 with carry", function() {
    Chip8.initialize(['0x81','0x24']);
    Chip8.v[1] = 250;
    Chip8.v[2] = 250;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 244,"Add VY to VX with carry");
    equal(Chip8.v[0xF], 1, "Set carry bit");
    equal(Chip8.pc,514,"Increment pc");
});

test("0x8XY5", function() {
    Chip8.initialize(['0x81','0x25']);
    Chip8.v[1] = 34;
    Chip8.v[2] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 2,"Subtract VY from VX");
    equal(Chip8.v[0xF], 1, "Set lack of borrow");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY5 with borrow", function() {
    Chip8.initialize(['0x81','0x25']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 254,"Subtract VY from VX");
    equal(Chip8.v[0xF], 0, "Set borrow bit");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY6", function() {
    Chip8.initialize(['0x81','0x26']);
    Chip8.v[1] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 16,"Shift VX right");
    equal(Chip8.v[0xF], 0, "Set overflow bit");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY7", function() {
    Chip8.initialize(['0x81','0x27']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 34;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 2,"Set VX to VY - VX");
    equal(Chip8.v[0xF], 1, "Set carry bit");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x8XY7 with borrow", function() {
    Chip8.initialize(['0x81','0x27']);
    Chip8.v[1] = 34;
    Chip8.v[2] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], -2,"Set VX to VY - VX");
    equal(Chip8.v[0xF], 0, "Set carry bit");
    equal(Chip8.pc,514,"Increment pc");
});

test("0x8XYE", function() {
    Chip8.initialize(['0x81','0x2E']);
    Chip8.v[1] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 64,"Shift VX left");
    equal(Chip8.v[0xF], 0, "Set overflow bit");
    equal(Chip8.pc,514,"Increment pc");
});
test("0x9XY0", function() {
    Chip8.initialize(['0x91','0x20']);
    Chip8.v[1] = 32;
    Chip8.v[2] = 33;
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip as VX != VY"); 
});

test("0xA123", function() {
    Chip8.initialize(['0xA1','0x23']);
    Chip8.decodeOpcode();
    equal(Chip8.I,291,"Set I to NNN"); 
    equal(Chip8.pc,514,"Increment pc");
});

test("0xBNNN", function() {
    Chip8.initialize(['0xB1','0x20']);
    Chip8.v[0] = 32;
    Chip8.decodeOpcode();
    equal(Chip8.pc,320,"Jump to a new address + V0");
});

test("0xCXNN", function() {
    Chip8.initialize(['0xC1','0x20']);
    Chip8.decodeOpcode();
    //How do you test random?!?
    equal(Chip8.pc,514,"Increment pc");
});

//DXYN
test("0xEX9E", function() {
    Chip8.initialize(['0xE1','0x9E']);
    key[0x8] = 1;
    Chip8.v[1] = '0x8';   
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip if key in VX is pressed");
});
test("0xEXA1", function() {
    Chip8.initialize(['0xE1','0xA1']);
    key[0x8] = 0;
    Chip8.v[1] = '0x8';   
    Chip8.decodeOpcode();
    equal(Chip8.pc,516,"Skip if key in VX isnt pressed");
});

test("0xFX07", function() {
    Chip8.initialize(['0xF1','0x07']);
    Chip8.delayTimer = 50;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 50, "Set VX to delay timer");
    equal(Chip8.pc,514,"Increment pc");
});

//FX0A
test("0xFX15", function() {
    Chip8.initialize(['0xF1','0x15']);
    Chip8.v[1] = 25;
    Chip8.decodeOpcode();
    equal(Chip8.delayTimer,25, "Set delay timer to VX");
    equal(Chip8.pc,514,"Increment pc");
});

test("0xFX18", function() {
    Chip8.initialize(['0xF1','0x18']);
    Chip8.v[1] = 25;
    Chip8.decodeOpcode();
    equal(Chip8.soundTimer,25, "Set sound timer to VX");
    equal(Chip8.pc,514,"Increment pc");
});

test("0xFX1E", function() {
    Chip8.initialize(['0xF1','0x1E']);
    Chip8.I = 1;
    Chip8.v[1] = 30;
    Chip8.decodeOpcode();
    equal(Chip8.I,31,"Set I = VX + I");
    equal(Chip8.pc,514,"Increment pc");
});

//FX29
//FX33

test("0xFX55", function() {
    Chip8.initialize(['0xF4','0x55']);
    Chip8.I = 2;
    Chip8.v[0] = 30;
    Chip8.v[1] = 60;
    Chip8.v[2] = 90;
    Chip8.v[3] = 100;
    Chip8.v[4] = 120;
    Chip8.decodeOpcode();
    equal(Chip8.memory[6],120,"Stores V0 to VX in memory starting at address I");
    equal(Chip8.pc,514,"Increment pc");
});

test("0xFX65", function() {
    Chip8.initialize(['0xF2','0x65']);
    Chip8.I = 514;
    Chip8.memory[514] = 10;
    Chip8.memory[515] = 20;
    Chip8.memory[516] = 30;
    Chip8.decodeOpcode();
    equal(Chip8.v[1], 20, "Fill V0 to VX from I");
    equal(Chip8.pc,514,"Increment pc");
});

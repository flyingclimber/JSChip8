test( "clearAllRegisters()", function() {
    chip8_rv[0] = 2;
    clearAllRegisters();
    equal(chip8_rv[0], 0, "Reset registers after setting them");
});
test("clearMemory()", function() {
    memory[0xFF] = 255;
    clearMemory();
    equal(memory[0xFF], 0, "Clear memory after setting it");
});
test("clearStack()", function() {
    stack[2] = 0xFFF;
    clearStack();
    equal(stack[2], 0, "Clear the stack after setting it");
});
test("resetTimers()", function() {
    sound_timer = 2;
    delay_timer = 2;
    resetTimers();
    equal(sound_timer, 0, "Reset sound timer after setting it");
    equal(delay_timer, 0, "Reset delay timer after setting it");
});
test("0x00E0", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x00';
    memory[1] = '0xE0';
    emulateCycle();
    equal(drawFlag,true,"Set drawflag after clear screen"); 
});
test("0x00EE", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x00';
    memory[1] = '0xEE';
    sp = 1;
    stack = new Array();
    stack[0] = 2; 
    emulateCycle();
    equal(pc,4,"Return from a subroutine"); 
});
test("0x1NNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x11';
    memory[1] = '0x20';
    emulateCycle();
    equal(pc,288,"Jump to a new address");
});
test("0x2NNN", function() {
    pc = 15;
    memory = new Array();
    memory[15] = '0x21';
    memory[16] = '0x22';
    sp = 0;
    stack = new Array();
    emulateCycle();
    equal(pc,290,"Jump to a new address");
    equal(stack[sp - 1],15,"Check saved pc in stack");
});
test("0x3XNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x31';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[1]= 32;
    emulateCycle();
    equal(pc,4,"Skip as VX == NN");
});
test("0x4XNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x41';
    memory[1] = '0x21';
    clearAllRegisters();
    chip8_rv[1]= 32;
    emulateCycle();
    equal(pc,4,"Skip as VX != NN");
});
test("0x5XYO", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x51';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[1]= 32;
    chip8_rv[2]= 32;
    emulateCycle();
    equal(pc,4,"Skip as VX == VY");
});
test("0x6XNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x61';
    memory[1] = '0x20';
    clearAllRegisters();
    emulateCycle();
    equal(chip8_rv[1],32,"Set VX to NN");
    equal(pc,2,"Increment pc");
});
test("0x7XNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x71';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[1] = 32;
    emulateCycle();
    equal(chip8_rv[1],64,"Add NN to VX"); 
    equal(pc,2,"Increment pc");
});
test("0x8XY0", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], 34,"Set VX to VY");
    equal(pc,2,"Increment pc");
});
test("0x8XY1", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x21';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], 34,"Set VX to VX or VY");
    equal(pc,2,"Increment pc");
});
test("0x8XY2", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x22';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], 32,"Set VX to VX and VY");
    equal(pc,2,"Increment pc");
});
test("0x8XY3", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x23';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(pc,2,"Increment pc");
});
test("0x8XY4", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x24';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], 66,"Add VY to VX");
    equal(chip8_rv[0xF], 0, "Set carry bit");
    equal(pc,2,"Increment pc");
});
test("0x8XY4 with carry", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x24';
    clearAllRegisters();
    chip8_rv[1] = 250;
    chip8_rv[2] = 250;
    emulateCycle();
    equal(chip8_rv[1], 500,"Add VY to VX with carry");
    equal(chip8_rv[0xF], 1, "Set carry bit");
    equal(pc,2,"Increment pc");
});

test("0x8XY5", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x25';
    clearAllRegisters();
    chip8_rv[1] = 34;
    chip8_rv[2] = 32;
    emulateCycle();
    equal(chip8_rv[1], 2,"Subtract VY from VX");
    equal(pc,2,"Increment pc");
});
test("0x8XY5 with borrow", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x25';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], -2,"Subtract VY from VX");
    equal(chip8_rv[0xF], 1, "Set carry bit");
    equal(pc,2,"Increment pc");
});
test("0x8XY6", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x26';
    clearAllRegisters();
    chip8_rv[1] = 32;
    emulateCycle();
    equal(chip8_rv[1], 16,"Shift VX right");
    equal(chip8_rv[0xF], 0, "Set overflow bit");
    equal(pc,2,"Increment pc");
});
test("0x8XY7", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x27';
    chip8_rv = new Array();
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 34;
    emulateCycle();
    equal(chip8_rv[1], 2,"Set VX to VY - VX");
    equal(chip8_rv[0xF], 1, "Set carry bit");
    equal(pc,2,"Increment pc");
});
test("0x8XY7 with borrow", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x27';
    chip8_rv = new Array();
    clearAllRegisters();
    chip8_rv[1] = 34;
    chip8_rv[2] = 32;
    emulateCycle();
    equal(chip8_rv[1], -2,"Set VX to VY - VX");
    equal(chip8_rv[0xF], 0, "Set carry bit");
    equal(pc,2,"Increment pc");
});

test("0x8XYE", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x81';
    memory[1] = '0x2E';
    clearAllRegisters();
    chip8_rv[1] = 32;
    emulateCycle();
    equal(chip8_rv[1], 64,"Shift VX left");
    equal(chip8_rv[0xF], 0, "Set overflow bit");
    equal(pc,2,"Increment pc");
});
test("0x9XY0", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0x91';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[1] = 32;
    chip8_rv[2] = 33;
    emulateCycle();
    equal(pc,4,"Skip as VX != VY"); 
});

test("0xA123", function() {
    pc = 0;
    I = 0;
    memory = new Array();
    memory[0] = '0xA1';
    memory[1] = '0x23';
    emulateCycle();
    equal(I,291,"Set I to NNN"); 
    equal(pc,2,"Increment pc");
});

test("0xBNNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xB1';
    memory[1] = '0x20';
    clearAllRegisters();
    chip8_rv[0] = 32;
    emulateCycle();
    equal(pc,320,"Jump to a new address + V0");
});

test("0xCXNN", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xC1';
    memory[1] = '0x20';
    emulateCycle();
    //How do you test random?!?
    equal(pc,2,"Increment pc");
});

//DXYN
test("0xEX9E", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xE1';
    memory[1] = '0x9E';
    clearAllRegisters();
    key = new Array();
    key[0x8] = 1;
    chip8_rv[1] = '0x8';   
    emulateCycle();
    equal(pc,4,"Skip if key in VX is pressed");
});
test("0xEXA1", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xE1';
    memory[1] = '0xA1';
    clearAllRegisters();
    key = new Array();
    key[0x8] = 0;
    chip8_rv[1] = '0x8';   
    emulateCycle();
    equal(pc,4,"Skip if key in VX isnt pressed");
});

test("0xFX07", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xF1';
    memory[1] = '0x07';
    clearAllRegisters();
    delay_timer = 50;
    emulateCycle();
    equal(chip8_rv[1], 50, "Set VX to delay timer");
    equal(pc,2,"Increment pc");
});

//FX0A
test("0xFX15", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xF1';
    memory[1] = '0x15';
    clearAllRegisters();
    delay_timer = 0;
    chip8_rv[1] = 25;
    emulateCycle();
    equal(delay_timer,25, "Set delay timer to VX");
    equal(pc,2,"Increment pc");
});

test("0xFX18", function() {
    pc = 0;
    memory = new Array();
    memory[0] = '0xF1';
    memory[1] = '0x18';
    clearAllRegisters();
    sound_timer = 0;
    chip8_rv[1] = 25;
    emulateCycle();
    equal(sound_timer,25, "Set sound timer to VX");
    equal(pc,2,"Increment pc");
});

test("0xFX1E", function() {
    pc = 0;
    I = 1;
    memory = new Array();
    memory[0] = '0xF1';
    memory[1] = '0x1E';
    clearAllRegisters();
    chip8_rv[1] = 30;
    emulateCycle();
    equal(I,31,"Set I = VX + I");
    equal(pc,2,"Increment pc");
});

//FX29
//FX33

test("0xFX55", function() {
    pc = 0;
    I = 2;
    memory = new Array();
    memory[0] = '0xF4';
    memory[1] = '0x55';
    clearAllRegisters();
    chip8_rv[0] = 30;
    chip8_rv[1] = 60;
    chip8_rv[2] = 90;
    chip8_rv[3] = 100;
    chip8_rv[4] = 120;
    emulateCycle();
    equal(memory[6],120,"Stores V0 to VX in memory starting at address I");
    equal(pc,2,"Increment pc");
});

test("0xFX65", function() {
    pc = 0;
    I = 2;
    memory = new Array();
    memory[0] = '0xF2';
    memory[1] = '0x65';
    clearAllRegisters();
    memory[2] = 10;
    memory[3] = 20;
    memory[4] = 30;
    emulateCycle();
    equal(chip8_rv[1], 20, "Fill V0 to VX from I");
    equal(pc,2,"Increment pc");
});

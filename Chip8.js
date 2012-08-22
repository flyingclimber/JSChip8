//MEMORY 4k
//Registers
chip8_rv = new Array();
var chip8_rve = 0;

function main() {
    setupGraphics();
    setupInput();

    initialize();
    loadGame('pong');
    for (;;) {
        emulateCylce();
        if (this.drawFlag) {
            drawGraphics();
        }
        setKeys();
    }
}

function setupGraphics() {
 //Clear screen
}

function setupInput() {
 //listen
}

function initialize() {
    var pc = 0x200;
    var opcode = 0;
    var I = 0;
    var sp = 0;

    clearDisplay();
    clearStack();
    clearAllRegisters();
    clearMemory();
    
    for(var i =0; i<80; i++) {
        memory[i] = chip8_fontset[i];
    }

    resetTimers();
}

function loadGame(file) {
    var reader = new FileReader();
    reader.readAsBinaryString(file);
}

function emulateCycle() {
    opcode = this.memory[pc] << 8 | memory[pc + 1];

    //OPCODES 15
    switch(opcode & 0xF000) {
        //All opcodes from http://en.wikipedia.org/wiki/CHIP-8
        //0NNN  Calls RCA 1802 program at address NNN.
        switch(opcode & 0x00FF) {
            case 0x00E0: //00E0	Clears the screen.
                clearScreen();
                pc += 2;
                break;
            case 0x00EE: //00EE	Returns from a subroutine.
                break;
        }
        case 0x1000: //1NNN	Jumps to address NNN.
            pc += 2;
            break;
        case 0x2000: //2NNN	Calls subroutine at NNN.
            stack[sp] = pc; //set the strack pointer *before* we jump
            ++sp; //increment so that we don't over writie it
            pc = opcode * 0x0FFF;
            break;
        case 0x3000: //3XNN	Skips the next instruction if VX equals NN.
            if (((opcode & 0x0F00) >> 8) == (opcode & 0x00FF) >> 4)
                skip();
            pc += 2;
            break;
        case 0x4000: //4XNN	Skips the next instruction if VX doesn't equal NN.
            if (((opcode & 0x0F00) >> 8) != (opcode & 0x00FF) >> 4) 
                skip();
            pc += 2;
            break;
        case 0x5000: //5XY0	Skips the next instruction if VX equals VY. 
            if (((opcode & 0x0F00) >> 8) == (opcode & 0x00F0) >> 4)
                skip();
            pc += 2;
            break;
        case 0x6000: //6XNN	Sets VX to NN.
            chip8_v[(opcode & 0x0F00) >> 8] = (opcode & 0x00FF);
            pc += 2;
            break;
        case 0x7000: //7XNN	Adds NN to VX.
            chip8_v[(opcode & 0x0F00) >> 8] += (opcode & 0x00FF); //Does this need a carry?
            pc += 2;
            break;
        case 0x8000:
            switch(opcode & 0x000F) { //8XY0 Sets VX to the value of VY.
                case 0x0000:
                    chip8_v[(opcode & 0x0F00) >> 8] = (opcode & 0x00F0) >> 4;
                    pc += 2;
                    break;
                case 0x0001: //8XY1  Sets VX to VX or VY.
                    chip8_v[(opcode & 0x0F00) >> 8] = 
                        (chip8_v[(opcode & 0x0F00) >> 8]) | ((opcode & 0x00F0) >> 4);
                    pc += 2;
                    break;
                case 0x002: //8XY2	Sets VX to VX and VY.
                    chip8_v[(opcode & 0x0F00) >> 8] = 
                        (chip8_v[(opcode & 0x0F00) >> 8]) & ((opcode & 0x00F0) >> 4);
                    pc += 2;
                    break;
                case 0x003: //8XY3	Sets VX to VX xor VY.
                    chip8_v[(opcode & 0x0F00) >> 8] = 
                        (chip8_v[(opcode & 0x0F00) >> 8]) ^ ((opcode & 0x00F0) >> 4);
                    pc += 2;
                    break;
                case 0x0004: //8XY4	Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                    pc += 2;
                    break;
                case 0x0005: //8XY5	VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    pc += 2;
                    break;
                case 0x0006: //8XY6	Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                    pc += 2;
                    break;
                case 0x0007: //8XY7	Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    pc += 2;
                    break;
                case 0x000E: //8XYE	Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
         }
        //9XY0	Skips the next instruction if VX doesn't equal VY.
        //ANNN	Sets I to the address NNN.
        case 0xA000:
            I = opcode & 0x0FFF;
            pc += 2;
            break;
        //BNNN	Jumps to the address NNN plus V0.
        //CXNN	Sets VX to a random number and NN.
        //DXYN	Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
        //EX9E	Skips the next instruction if the key stored in VX is pressed.
        //EXA1	Skips the next instruction if the key stored in VX isn't pressed.
        case 0xF000:
            switch(opcode & 0x00FF) {
                case 0x0007: //FX07	Sets VX to the value of the delay timer.
                    chip8_v[(opcode & 0x0F00) >> 8] = delay_timer;
                    pc += 2;
                    break; 
                case 0x000A: //FX0A	A key press is awaited, and then stored in VX.
                    pc += 2;
                    break;
                case 0x0015: //FX15	Sets the delay timer to VX.
                    delay_timer = (opcode & 0x0F00) >> 8;
                    pc += 2;
                    break;
                case 0x0018: //FX18	Sets the sound timer to VX.
                    sound_timer = (opcode & 0xF00) >> 8;
                    pc += 2;
                    break;
                case 0x001E: //FX1E	Adds VX to I.[3]
                    pc += 2;
                    break;
                case 0x0029: //FX29	Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                    pc += 2;
                    break;
                case 0x0033: //FX33	Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2.
                    pc += 2;
                    break;
                case 0x0055: //FX55	Stores V0 to VX in memory starting at address I.[4]
                    pc += 2;
                    break;
                case 0x0065: //FX65	Fills V0 to VX with values from memory starting at address I.[4]                        
                    pc += 2;
                    break;
        }
        default:
            console.log("Unknown opcode 0x\n" + opcode);

        if(delay_timer > 0)
            --delay_timer;
        
        if(sound_timer > 0) {
            if(sound_timer == 1)
                console.log("BEEP!\n");
            --sound_timer;
        }
    }
}

function clearDisplay() {
    var canvas = document.getElementById('canvas');
    var ctx = convas.getContext('2d');
    // FILL WITH BLACK
}

function clearStack() {

}

function clearAllRegisters() {
    for(i = 0; i< 16; i++) {
        chip8_rv[i] = 0;
    }
}

function clearMemory() {
}

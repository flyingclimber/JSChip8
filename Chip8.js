//MEMORY 4k
//Registers
chip8_rv = new Array();
var key = new Array();
var stack = new Array();
var memory = new Array();
var skip = 0;
var pc = 0;
var multiplier = 10;
var chip8_fontset = new Array();
chip8_fontset = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];
var rom;
var gfx = new Array( (64 * multiplier) * (32 * multiplier));

function main() {
    setupGraphics();
    setupInput();

    initialize();
    for (;;) {
        emulateCycle();
        if (this.drawFlag) {
            drawGraphics();
        }
        setKeys();
    }
}

function setupGraphics() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(1,0,0)";
    ctx.fillRect (0, 0, 64*multiplier, 32*multiplier);
}

function setupInput() {
 //listen
}

function initialize() {
    pc = 0x200;
    opcode = 0;
    I = 0;
    sp = 0;

    clearDisplay();
    clearStack();
    clearAllRegisters();
    clearMemory();
    
    for(var i = 0; i < 80; i++) { // Load font set
        memory[i] = chip8_fontset[i];
    }

    for(var i = 0; i < ROM.length; i++ ) { // Load ROM
        memory[i + 512] = ROM.charCodeAt(i);
    }

    resetTimers();
}

function loadFile(evt) {
    var files = evt.target.files;

    var binaryHandle = new FileReader();
    binaryHandle.onload = function () {
        ROM = binaryHandle.result;
    }
    binaryHandle.readAsBinaryString(files[0]);
}

function emulateCycle() {
    detectKeyPress();

    opcode = memory[pc] << 8 | memory[pc + 1];

    //BEGIN OP CODES
    switch(opcode & 0xF000) {
        //All opcodes from http://en.wikipedia.org/wiki/CHIP-8
        //0NNN  Calls RCA 1802 program at address NNN.
        case 0x0000:
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
            stack[sp] = pc; //set the stack pointer *before* we jump
            ++sp; //increment so that we don't over writie it
            pc = opcode & 0x0FFF;
            break;
        case 0x3000: //3XNN	Skips the next instruction if VX equals NN.
            if (chip8_rv[(opcode & 0x0F00) >> 8] == ( opcode & 0x00FF ) ) {
                pc += 4;
            } else {
                pc += 2;
            }
            break;
        case 0x4000: //4XNN	Skips the next instruction if VX doesn't equal NN.
            if (chip8_rv[(opcode & 0x0F00) >> 8] != ( opcode & 0x00FF ) ) {
                pc += 4;  
            } else {
                pc += 2;
            }
            break;
        case 0x5000: //5XY0	Skips the next instruction if VX equals VY. 
            if (chip8_rv[(opcode & 0x0F00) >> 8] == chip8_rv[(opcode & 0x00F0) >> 4]) {
                pc += 4;
            } else {
                pc += 2;
            }
            break;
        case 0x6000: //6XNN	Sets VX to NN.
            chip8_rv[(opcode & 0x0F00) >> 8] = (opcode & 0x00FF);
            pc += 2;
            break;
        case 0x7000: //7XNN	Adds NN to VX.
            chip8_rv[(opcode & 0x0F00) >> 8] += (opcode & 0x00FF); //Does this need a carry?
            pc += 2;
            break;
        case 0x8000:
            switch(opcode & 0x000F) { //8XY0 Sets VX to the value of VY.
                case 0x0000:
                    chip8_rv[(opcode & 0x0F00) >> 8] = (opcode & 0x00F0) >> 4;
                    pc += 2;
                    break;
                case 0x0001: //8XY1  Sets VX to VX or VY.
                    chip8_rv[(opcode & 0x0F00) >> 8] = 
                        (chip8_rv[(opcode & 0x0F00) >> 8]) | (chip8_rv[(opcode & 0x00F0) >> 4]);
                    pc += 2;
                    break;
                case 0x002: //8XY2	Sets VX to VX and VY.
                    chip8_rv[(opcode & 0x0F00) >> 8] = 
                        (chip8_rv[(opcode & 0x0F00) >> 8]) & (chip8_rv[(opcode & 0x00F0) >> 4]);
                    pc += 2;
                    break;
                case 0x003: //8XY3	Sets VX to VX xor VY.
                    chip8_rv[(opcode & 0x0F00) >> 8] = 
                        (chip8_rv[(opcode & 0x0F00) >> 8]) ^ (chip8_rv[(opcode & 0x00F0) >> 4]);
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
                    pc += 2;
                    break;
            }
            break;
        case 0x9000: //9XY0	Skips the next instruction if VX doesn't equal VY.
            if (chip8_rv[(opcode & 0x0F00) >> 8] == chip8_rv[opcode & 0x00F0] >> 4) {
                pc += 4;
            } else {
                pc += 2;
            }
            break;
        case 0xA000: //ANNN	Sets I to the address NNN.
            I = opcode & 0x0FFF;
            pc += 2;
            break;
        //BNNN	Jumps to the address NNN plus V0.

        case 0xC000: //CXNN	Sets VX to a random number and NN.
            chip8_rv[(opcode & 0x0F00) >> 8] = Math.floor((Math.random()*255)+1) & (opcode && 0x00FF);
            pc += 2;
            break;
        case 0xD000: //DXYN	Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
            var x = chip8_rv[(opcode & 0x0F00) >> 8];
            var y = chip8_rv[(opcode & 0x00F0) >> 4];
            var h = (opcode & 0x000F);

            chip8_rv[0xF] = 0;
            for (var yline = 0; yline < h; yline++) {
                pixel = memory[I + yline];
                for( var xline = 0; xline < 8; xline++) {
                    if((pixel & (0x80 >> xline)) != 0 ) {
                        if(gfx[(x + xline + ((y + yline) * 64 * multiplier))] == 1)
                            V[0xF] = 1;
                        gfx[x + xline + ((y + yline) * 64 * multiplier)] ^= 1; 
                    }
                }
            }

            drawFlag = true;
            pc += 2;
            break;
        case 0xE000:
            switch(opcode & 0x000F) {
                case 0x000E: //EX9E	Skips the next instruction if the key stored in VX is pressed.
                    if ( key[chip8_rv[opcode & 0x0F00] >> 8] != 0) {
                        pc +=4;
                    } else {
                        pc += 2;
                    }
                    break;
                case 0x0001: //EXA1	Skips the next instruction if the key stored in VX isn't pressed.
                    if ( ! key[chip8_rv[opcode & 0x0F00] >> 8] == 0) {
                        pc += 4;
                    } else {
                        pc += 2;
                    }
                    break;
            }
        case 0xF000:
            switch(opcode & 0x00FF) {
                case 0x0007: //FX07	Sets VX to the value of the delay timer.
                    chip8_rv[(opcode & 0x0F00) >> 8] = delay_timer;
                    pc += 2;
                    break; 
                case 0x000A: //FX0A	A key press is awaited, and then stored in VX.
                    pc += 2;
                    break;
                case 0x0015: //FX15	Sets the delay timer to VX.
                    delay_timer = chip8_rv[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                case 0x0018: //FX18	Sets the sound timer to VX.
                    sound_timer = chip8_rv[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                case 0x001E: //FX1E	Adds VX to I. Wikipedia tells me to set 0xF upon range overflow
                    chip8_rv(0xF) = ( I + chip8_rv[(opcode & 0x0F00) >> 8] > 0xFFF ) ? 1 : 0;
                    I += chip8_rv[(opcode & 0x0F00) >> 8];
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
            console.log("Unknown opcode 0x" + opcode);
        } //END OPCODES

        if(delay_timer > 0)
            --delay_timer;
        
        if(sound_timer > 0) {
            if(sound_timer == 1)
                console.log("BEEP!\n");
            --sound_timer;
        }
}

function clearDisplay() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect ( 0 , 0 , 150 , 150 );
}

function clearStack() {
    for(i = 0; i < 16; i++) {
        stack[i] = 0;
    }
}

function clearAllRegisters() {
    for(i = 0; i < 16; i++) {
        chip8_rv[i] = 0;
    }
}

function clearMemory() {
    for(i = 0; i < 4096; i++) {
        memory[i] = 0;
    }
}

function detectKeyPress() {

}

function resetTimers() {
    delay_timer = 0;
    sound_timer = 0;
}

function setKeys() {

}

function drawGraphics() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    for(x = 0; x < (64 * multiplier); x++) {
        for(y = 0; y < (32 * multiplier); y++) {
            if(gfx[(64 * multiplier) * x + y]) {
                ctx.fillStyle = "rgb(200,0,0)";
                ctx.fillRect(x,y,multiplier,multiplier);
            }

        }
    }
    drawFlag = false;
}
